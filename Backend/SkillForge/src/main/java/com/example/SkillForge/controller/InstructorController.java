package com.example.SkillForge.controller;

import com.example.SkillForge.entity.Subject;
import com.example.SkillForge.entity.Topic;
import com.example.SkillForge.model.User;
import com.example.SkillForge.repository.CourseRepository;
import com.example.SkillForge.repository.QuizAttemptRepository;
import com.example.SkillForge.repository.QuizRepository;
import com.example.SkillForge.repository.StudentTopicProgressRepository;
import com.example.SkillForge.repository.SubjectRepository;
import com.example.SkillForge.repository.TopicRepository;
import com.example.SkillForge.repository.UserRepository;
import com.example.SkillForge.service.AnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
public class InstructorController {

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private AnalyticsService analyticsService;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private TopicRepository topicRepository;

    @Autowired
    private StudentTopicProgressRepository studentTopicProgressRepository;

    @Autowired
    private QuizRepository quizRepository;

    @Autowired
    private QuizAttemptRepository quizAttemptRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/instructor/dashboard")
    public String instructorDashboard() {
        return "Welcome to Instructor Dashboard";
    }

    @GetMapping("/instructor/analytics")
    public Map<String, Object> getAnalytics(@RequestParam Long instructorId) {
        List<Long> courseIds = courseRepository.findByInstructorId(instructorId).stream()
            .map(c -> c.getId())
            .collect(Collectors.toList());
        return analyticsService.getInstructorAnalytics(courseIds);
    }

    @GetMapping("/instructor/insights")
    public Map<String, Object> getStudentInsights(@RequestParam Long instructorId) {
        List<Long> courseIds = courseRepository.findByInstructorId(instructorId).stream()
                .map(c -> c.getId())
                .collect(Collectors.toList());
        return analyticsService.getInstructorStudentInsights(courseIds);
    }

    /**
     * Course-wide topic completion progress (aggregated across all students).
     * Returns how many distinct topics in this course have been completed by at least one student.
     */
    @GetMapping("/instructor/topic-progress")
    public Map<String, Object> getTopicProgress(@RequestParam Long courseId) {
        List<Subject> subjects = subjectRepository.findByCourse_Id(courseId);
        List<Long> topicIds = subjects.stream()
                .flatMap(s -> topicRepository.findBySubject_Id(s.getId()).stream())
                .map(Topic::getId)
                .toList();

        int totalTopics = topicIds.size();
        if (totalTopics == 0) {
            return Map.of("topicsDone", 0, "topicsTotal", 0);
        }

        Set<Long> completedDistinctTopics = studentTopicProgressRepository.findByTopicIdIn(topicIds).stream()
                .map(p -> p.getTopicId())
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        return Map.of(
                "topicsDone", completedDistinctTopics.size(),
                "topicsTotal", totalTopics
        );
    }

    @GetMapping("/instructor/students")
    public List<Map<String, Object>> getInstructorStudents(@RequestParam Long instructorId) {
        List<Long> courseIds = courseRepository.findByInstructorId(instructorId).stream()
                .map(c -> c.getId())
                .toList();
        Set<Long> quizIds = courseIds.stream()
                .flatMap(cid -> quizRepository.findByCourseId(cid).stream())
                .map(q -> q.getId())
                .collect(Collectors.toSet());
        Set<Long> studentIds = quizIds.stream()
                .flatMap(qid -> quizAttemptRepository.findByQuizId(qid).stream())
                .map(a -> a.getStudentId())
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        return studentIds.stream()
                .sorted()
                .map(id -> {
                    User u = userRepository.findById(id).orElse(null);
                    return Map.<String, Object>of(
                            "studentId", id,
                            "name", u != null ? u.getName() : null,
                            "email", u != null ? u.getEmail() : null
                    );
                })
                .toList();
    }
}