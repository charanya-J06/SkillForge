package com.example.SkillForge.service;

import com.example.SkillForge.dto.SuggestedContentDTO;
import com.example.SkillForge.entity.*;
import com.example.SkillForge.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class AdaptiveLearningService {

    @Autowired
    private QuizAttemptRepository quizAttemptRepository;

    @Autowired
    private StudentTopicProgressRepository topicProgressRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private QuizRepository quizRepository;

    @Autowired
    private TopicRepository topicRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    
    @Transactional(readOnly = true)
    public List<SuggestedContentDTO> getSuggestions(Long studentId) {
        List<SuggestedContentDTO> suggestions = new ArrayList<>();

        List<QuizAttempt> attempts = quizAttemptRepository.findByStudentId(studentId);
        Map<Long, List<QuizAttempt>> attemptsByQuiz = attempts.stream()
                .collect(Collectors.groupingBy(QuizAttempt::getQuizId));
        Set<Long> attemptedQuizIds = attemptsByQuiz.keySet();

        Map<Long, Course> courseMap = courseRepository.findAll().stream()
                .collect(Collectors.toMap(Course::getId, Function.identity()));

        double recentAvgScore = attempts.isEmpty() ? 0 : attempts.stream()
                .sorted(Comparator.comparing(QuizAttempt::getAttemptTime, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .limit(10)
                .mapToDouble(a -> a.getScore() != null ? a.getScore() : 0)
                .average()
                .orElse(0);

        Set<Long> completedTopicIds = topicProgressRepository.findByStudentId(studentId).stream()
                .map(StudentTopicProgress::getTopicId)
                .collect(Collectors.toSet());

        List<Course> courses = new ArrayList<>(courseMap.values());
        courses.sort(Comparator.comparing(Course::getId)); // stable ordering for "newest" fallback via highest id

        // Build per-course progress using topics + quizzes
        record CourseProgress(Long courseId, int completedTopics, int totalTopics, int attemptedQuizzes, int totalQuizzes, int overallPercent) {}
        Map<Long, CourseProgress> courseProgress = new HashMap<>();

        for (Course c : courses) {
            List<Subject> subs = subjectRepository.findByCourse_Id(c.getId());
            List<Topic> topics = new ArrayList<>();
            for (Subject s : subs) {
                topics.addAll(topicRepository.findBySubject_Id(s.getId()));
            }
            int totalTopics = topics.size();
            int completedTopics = (int) topics.stream().filter(t -> completedTopicIds.contains(t.getId())).count();
            int topicPercent = totalTopics > 0 ? (int) Math.round((completedTopics * 100.0) / totalTopics) : 0;

            List<Quiz> quizzes = quizRepository.findByCourseId(c.getId());
            int totalQuizzes = quizzes.size();
            int attemptedQuizzes = (int) quizzes.stream().filter(q -> attemptedQuizIds.contains(q.getId())).count();
            int quizPercent = totalQuizzes > 0 ? (int) Math.round((attemptedQuizzes * 100.0) / totalQuizzes) : 0;

            List<Integer> parts = new ArrayList<>();
            if (totalTopics > 0) parts.add(topicPercent);
            if (totalQuizzes > 0) parts.add(quizPercent);
            int overall = parts.isEmpty() ? 0 : (int) Math.round(parts.stream().mapToInt(Integer::intValue).average().orElse(0));
            courseProgress.put(c.getId(), new CourseProgress(c.getId(), completedTopics, totalTopics, attemptedQuizzes, totalQuizzes, overall));
        }

        double completionPercent = courses.isEmpty() ? 0 : courseProgress.values().stream().mapToInt(CourseProgress::overallPercent).average().orElse(0);
        double adaptiveMetric = (recentAvgScore * 0.7) + (completionPercent * 0.3);
        String adaptiveLevel = adaptiveMetric < 40 ? "BEGINNER" : adaptiveMetric < 75 ? "INTERMEDIATE" : "ADVANCED";

        // Weak-area quiz retakes first (avg score < 70)
        Map<Long, Quiz> quizMap = attemptsByQuiz.keySet().isEmpty()
                ? Map.of()
                : quizRepository.findAllById(attemptsByQuiz.keySet()).stream()
                .collect(Collectors.toMap(Quiz::getId, Function.identity()));

        attemptsByQuiz.entrySet().stream()
                .map(e -> {
                    double avg = e.getValue().stream().mapToDouble(a -> a.getScore() != null ? a.getScore() : 0).average().orElse(0);
                    int count = e.getValue().size();
                    return Map.<String, Object>of(
                            "quizId", e.getKey(),
                            "avg", avg,
                            "attempts", count
                    );
                })
                .filter(m -> (double) m.get("avg") < 70)
                .sorted(Comparator
                        .comparingDouble((Map<String, Object> m) -> (double) m.get("avg"))
                        .thenComparing((Map<String, Object> m) -> -(int) m.get("attempts")))
                .limit(2)
                .forEach(m -> {
                    Long quizId = (Long) m.get("quizId");
                    String title = Optional.ofNullable(quizMap.get(quizId)).map(Quiz::getTitle).orElse("Quiz " + quizId);
                    double avg = (double) m.get("avg");
                    Long courseId = Optional.ofNullable(quizMap.get(quizId)).map(Quiz::getCourseId).orElse(null);
                    String courseName = courseId != null && courseMap.containsKey(courseId) ? courseMap.get(courseId).getTitle() : null;
                    suggestions.add(SuggestedContentDTO.builder()
                            .type("QUIZ")
                            .id(quizId)
                            .title(title)
                            .reason("Improve this weak area (avg " + Math.round(avg * 10) / 10.0 + "%). Recommended level: " + adaptiveLevel)
                            .difficultyLevel(adaptiveLevel)
                            .courseId(courseId)
                            .courseName(courseName)
                            .build());
                });

        List<Long> inProgressCourseIds = courseProgress.values().stream()
                .filter(p -> (p.totalTopics > 0 && p.completedTopics > 0 && p.completedTopics < p.totalTopics)
                        || (p.totalQuizzes > 0 && p.attemptedQuizzes > 0 && p.attemptedQuizzes < p.totalQuizzes))
                .sorted(Comparator.comparingInt((CourseProgress p) -> -p.overallPercent))
                .map(CourseProgress::courseId)
                .toList();

        if (suggestions.size() < 5) {
            for (Long courseId : inProgressCourseIds) {
                List<Subject> subs = subjectRepository.findByCourse_Id(courseId);
                List<Topic> courseTopics = new ArrayList<>();
                for (Subject s : subs) courseTopics.addAll(topicRepository.findBySubject_Id(s.getId()));
                courseTopics.sort(Comparator.comparing(Topic::getId));
                for (Topic t : courseTopics) {
                    if (!completedTopicIds.contains(t.getId())) {
                        Long subjectId = t.getSubject() != null ? t.getSubject().getId() : null;
                        Long topicCourseId = (t.getSubject() != null && t.getSubject().getCourse() != null) ? t.getSubject().getCourse().getId() : null;
                        String courseName = topicCourseId != null && courseMap.containsKey(topicCourseId) ? courseMap.get(topicCourseId).getTitle() : null;
                        suggestions.add(SuggestedContentDTO.builder()
                                .type("TOPIC")
                                .id(t.getId())
                                .title(t.getTitle())
                                .reason("Continue your current course path. Recommended level: " + adaptiveLevel)
                                .difficultyLevel(adaptiveLevel)
                                .courseId(topicCourseId)
                                .courseName(courseName)
                                .subjectId(subjectId)
                                .build());
                        if (suggestions.size() >= 4) break;
                    }
                }
                if (suggestions.size() >= 4) break;
            }
        }

        // Unattempted quiz in an in-progress course (up to 1)
        if (suggestions.size() < 5) {
            for (Long courseId : inProgressCourseIds) {
                List<Quiz> quizzes = quizRepository.findByCourseId(courseId);
                Optional<Quiz> unattempted = quizzes.stream()
                        .sorted(Comparator.comparing(Quiz::getId))
                        .filter(q -> !attemptedQuizIds.contains(q.getId()))
                        .findFirst();
                if (unattempted.isPresent()) {
                    Quiz q = unattempted.get();
                    String courseName = courseMap.containsKey(q.getCourseId()) ? courseMap.get(q.getCourseId()).getTitle() : null;
                    suggestions.add(SuggestedContentDTO.builder()
                            .type("QUIZ")
                            .id(q.getId())
                            .title(q.getTitle())
                            .reason("Build consistency: attempt a new quiz in your current course. Recommended level: " + adaptiveLevel)
                            .difficultyLevel(adaptiveLevel)
                            .courseId(q.getCourseId())
                            .courseName(courseName)
                            .build());
                    break;
                }
            }
        }

        // If still not enough: explore a "new" course with low progress (fallback)
        if (suggestions.size() < 5 && !courses.isEmpty()) {
            Course pick = courses.stream()
                    .sorted(Comparator.comparingLong(Course::getId).reversed())
                    .findFirst()
                    .orElse(null);
            if (pick != null) {
                CourseProgress p = courseProgress.get(pick.getId());
                String reason = "Explore a new course to expand your skills. Recommended level: " + adaptiveLevel;
                if (p != null && (p.totalTopics > 0 || p.totalQuizzes > 0)) {
                    reason = "New learning opportunity (current completion " + p.overallPercent + "%). Recommended level: " + adaptiveLevel;
                }
                suggestions.add(SuggestedContentDTO.builder()
                        .type("COURSE")
                        .id(pick.getId())
                        .title(pick.getTitle())
                        .reason(reason)
                        .difficultyLevel(adaptiveLevel)
                        .courseId(pick.getId())
                        .courseName(pick.getTitle())
                        .build());
            }
        }

        // Ensure max 5 and unique items (avoid duplicates if any)
        Set<String> seen = new HashSet<>();
        return suggestions.stream()
                .filter(s -> seen.add(s.getType() + ":" + s.getId()))
                .limit(5)
                .toList();
    }
}
