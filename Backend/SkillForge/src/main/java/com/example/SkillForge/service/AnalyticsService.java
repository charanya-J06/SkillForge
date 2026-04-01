package com.example.SkillForge.service;

import com.example.SkillForge.entity.Quiz;
import com.example.SkillForge.entity.QuizAttempt;
import com.example.SkillForge.model.User;
import com.example.SkillForge.repository.QuizAttemptRepository;
import com.example.SkillForge.repository.QuizRepository;
import com.example.SkillForge.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    @Autowired
    private QuizAttemptRepository quizAttemptRepository;

    @Autowired
    private QuizRepository quizRepository;

    @Autowired
    private UserRepository userRepository;

     // Student: topic-wise (quiz-wise) performance and score trend over time.

    public Map<String, Object> getStudentAnalytics(Long studentId) {
        List<QuizAttempt> attempts = quizAttemptRepository.findByStudentId(studentId);
        List<Map<String, Object>> byQuiz = new ArrayList<>();
        Set<Long> quizIds = attempts.stream().map(QuizAttempt::getQuizId).collect(Collectors.toSet());
        for (Long quizId : quizIds) {
            String quizTitle = quizRepository.findById(quizId).map(Quiz::getTitle).orElse("Quiz " + quizId);
            List<QuizAttempt> forQuiz = attempts.stream().filter(a -> a.getQuizId().equals(quizId)).toList();
            double avg = forQuiz.stream().mapToDouble(QuizAttempt::getScore).average().orElse(0);
            byQuiz.add(Map.<String, Object>ofEntries(
                Map.entry("quizId", quizId),
                Map.entry("quizTitle", quizTitle),
                Map.entry("attempts", forQuiz.size()),
                Map.entry("averageScore", Math.round(avg * 10) / 10.0),
                Map.entry("bestScore", forQuiz.stream().mapToDouble(QuizAttempt::getScore).max().orElse(0))
            ));
        }
        List<Map<String, Object>> trend = attempts.stream()
            .sorted(Comparator.comparing(QuizAttempt::getAttemptTime))
            .map(a -> {
                String quizTitle = quizRepository.findById(a.getQuizId()).map(Quiz::getTitle).orElse("Quiz " + a.getQuizId());
                String diff = quizRepository.findById(a.getQuizId()).map(Quiz::getDifficultyLevel).orElse("");
                return Map.<String, Object>ofEntries(
                    Map.entry("attemptId", a.getId()),
                    Map.entry("attemptTime", a.getAttemptTime().toString()),
                    Map.entry("score", a.getScore()),
                    Map.entry("quizId", a.getQuizId()),
                    Map.entry("quizTitle", quizTitle),
                    Map.entry("difficultyLevel", diff)
                );
            })
            .toList();
        double overallAvg = attempts.isEmpty() ? 0 : attempts.stream().mapToDouble(QuizAttempt::getScore).average().orElse(0);

        // Simple learning streak: count consecutive days with at least one attempt, going backwards from last activity day
        int streakDays = 0;
        if (!attempts.isEmpty()) {
            SortedSet<String> days = attempts.stream()
                    .map(a -> a.getAttemptTime().toLocalDate().toString())
                    .collect(Collectors.toCollection(TreeSet::new));
            if (!days.isEmpty()) {
                List<String> ordered = new ArrayList<>(days);
                Collections.sort(ordered);
                java.time.LocalDate current = java.time.LocalDate.parse(ordered.get(ordered.size() - 1));
                while (days.contains(current.toString())) {
                    streakDays++;
                    current = current.minusDays(1);
                }
            }
        }
        return Map.of(
            "overallAverageScore", Math.round(overallAvg * 10) / 10.0,
            "totalAttempts", attempts.size(),
            "byQuiz", byQuiz,
            "scoreTrend", trend,
            "streakDays", streakDays
        );
    }

    public Map<String, Object> getStudentAnalyticsForCourse(Long studentId, Long courseId) {
        List<QuizAttempt> attempts = quizAttemptRepository.findByStudentId(studentId);
        if (attempts.isEmpty()) {
            return Map.of(
                    "overallAverageScore", 0,
                    "totalAttempts", 0,
                    "byQuiz", List.of(),
                    "scoreTrend", List.of()
            );
        }

        Set<Long> quizIds = attempts.stream().map(QuizAttempt::getQuizId).collect(Collectors.toSet());
        Map<Long, Quiz> quizMap = quizRepository.findAllById(quizIds).stream()
                .collect(Collectors.toMap(Quiz::getId, q -> q));

        List<QuizAttempt> filtered = attempts.stream()
                .filter(a -> {
                    Quiz q = quizMap.get(a.getQuizId());
                    return q != null && Objects.equals(q.getCourseId(), courseId);
                })
                .toList();

        List<Map<String, Object>> byQuiz = new ArrayList<>();
        Set<Long> filteredQuizIds = filtered.stream().map(QuizAttempt::getQuizId).collect(Collectors.toSet());
        for (Long quizId : filteredQuizIds) {
            String quizTitle = Optional.ofNullable(quizMap.get(quizId)).map(Quiz::getTitle).orElse("Quiz " + quizId);
            List<QuizAttempt> forQuiz = filtered.stream().filter(a -> a.getQuizId().equals(quizId)).toList();
            double avg = forQuiz.stream().mapToDouble(QuizAttempt::getScore).average().orElse(0);
            byQuiz.add(Map.<String, Object>ofEntries(
                    Map.entry("quizId", quizId),
                    Map.entry("quizTitle", quizTitle),
                    Map.entry("attempts", forQuiz.size()),
                    Map.entry("averageScore", Math.round(avg * 10) / 10.0),
                    Map.entry("bestScore", forQuiz.stream().mapToDouble(QuizAttempt::getScore).max().orElse(0))
            ));
        }

        List<Map<String, Object>> trend = filtered.stream()
                .sorted(Comparator.comparing(QuizAttempt::getAttemptTime))
                .map(a -> {
                    String quizTitle = Optional.ofNullable(quizMap.get(a.getQuizId())).map(Quiz::getTitle).orElse("Quiz " + a.getQuizId());
                    String diff = Optional.ofNullable(quizMap.get(a.getQuizId())).map(Quiz::getDifficultyLevel).orElse("");
                    return Map.<String, Object>ofEntries(
                            Map.entry("attemptId", a.getId()),
                            Map.entry("attemptTime", a.getAttemptTime().toString()),
                            Map.entry("score", a.getScore()),
                            Map.entry("quizId", a.getQuizId()),
                            Map.entry("quizTitle", quizTitle),
                            Map.entry("difficultyLevel", diff)
                    );
                })
                .toList();

        double overallAvg = filtered.isEmpty() ? 0 : filtered.stream().mapToDouble(QuizAttempt::getScore).average().orElse(0);
        return Map.of(
                "overallAverageScore", Math.round(overallAvg * 10) / 10.0,
                "totalAttempts", filtered.size(),
                "byQuiz", byQuiz,
                "scoreTrend", trend
        );
    }

    
     // Instructor insights: strengths/weaknesses per student (based on quiz averages).
     
    public Map<String, Object> getInstructorStudentInsights(List<Long> courseIds) {
        Set<Long> quizIds = new HashSet<>();
        for (Long courseId : courseIds) {
            quizIds.addAll(quizRepository.findByCourseId(courseId).stream().map(Quiz::getId).toList());
        }
        if (quizIds.isEmpty()) {
            return Map.of("students", List.of());
        }

        Map<Long, Quiz> quizMap = quizRepository.findAllById(quizIds).stream()
                .collect(Collectors.toMap(Quiz::getId, q -> q));

        List<QuizAttempt> allAttempts = new ArrayList<>();
        for (Long quizId : quizIds) {
            allAttempts.addAll(quizAttemptRepository.findByQuizId(quizId));
        }

        Map<Long, List<QuizAttempt>> byStudent = allAttempts.stream()
                .collect(Collectors.groupingBy(QuizAttempt::getStudentId));

        List<Map<String, Object>> students = new ArrayList<>();
        for (Map.Entry<Long, List<QuizAttempt>> entry : byStudent.entrySet()) {
            Long studentId = entry.getKey();
            List<QuizAttempt> attempts = entry.getValue();

            Map<Long, Double> avgByQuiz = attempts.stream()
                    .collect(Collectors.groupingBy(
                            QuizAttempt::getQuizId,
                            Collectors.averagingDouble(a -> a.getScore() != null ? a.getScore() : 0)
                    ));

            List<Map<String, Object>> quizAverages = avgByQuiz.entrySet().stream()
                    .map(e -> Map.<String, Object>of(
                            "quizId", e.getKey(),
                            "quizTitle", Optional.ofNullable(quizMap.get(e.getKey())).map(Quiz::getTitle).orElse("Quiz " + e.getKey()),
                            "averageScore", Math.round(e.getValue() * 10) / 10.0
                    ))
                    .sorted(Comparator.comparingDouble(m -> (double) m.get("averageScore")))
                    .toList();

            List<Map<String, Object>> weakest = quizAverages.stream().limit(3).toList();
            List<Map<String, Object>> strongest = quizAverages.stream()
                    .sorted((a, b) -> Double.compare((double) b.get("averageScore"), (double) a.get("averageScore")))
                    .limit(3)
                    .toList();

            double overallAvg = attempts.stream().mapToDouble(a -> a.getScore() != null ? a.getScore() : 0).average().orElse(0);

            String studentName = userRepository.findById(studentId).map(User::getName).orElse(null);

            students.add(Map.of(
                    "studentId", studentId,
                    "studentName", studentName,
                    "overallAverageScore", Math.round(overallAvg * 10) / 10.0,
                    "weakest", weakest,
                    "strongest", strongest
            ));
        }

        students.sort((a, b) -> Double.compare((double) b.get("overallAverageScore"), (double) a.get("overallAverageScore")));
        return Map.of("students", students);
    }

   
    public Map<String, Object> getInstructorAnalytics(List<Long> courseIds) {
        Set<Long> quizIds = new HashSet<>();
        for (Long courseId : courseIds) {
            quizIds.addAll(quizRepository.findByCourseId(courseId).stream().map(q -> q.getId()).toList());
        }
        List<QuizAttempt> allAttempts = new ArrayList<>();
        for (Long quizId : quizIds) {
            allAttempts.addAll(quizAttemptRepository.findByQuizId(quizId));
        }
        List<Map<String, Object>> table = allAttempts.stream()
            .map(a -> Map.<String, Object>of(
                "studentId", a.getStudentId(),
                "quizId", a.getQuizId(),
                "score", a.getScore(),
                "attemptTime", a.getAttemptTime().toString(),
                "correctCount", a.getCorrectCount(),
                "totalQuestions", a.getTotalQuestions()
            ))
            .toList();
        double avgScore = allAttempts.isEmpty() ? 0 : allAttempts.stream().mapToDouble(QuizAttempt::getScore).average().orElse(0);
        return Map.of(
            "totalAttempts", allAttempts.size(),
            "averageScore", Math.round(avgScore * 10) / 10.0,
            "attemptsTable", table
        );
    }
}
