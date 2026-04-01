package com.example.SkillForge.controller;

import com.example.SkillForge.entity.*;
import com.example.SkillForge.model.*;
import com.example.SkillForge.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;
import java.util.stream.Collectors;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin")
@CrossOrigin(origins = "http://localhost:3000")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private TopicRepository topicRepository;

    @Autowired
    private QuizRepository quizRepository;

    @Autowired
    private QuizAttemptRepository quizAttemptRepository;

    @Autowired
    private FeedbackRepository feedbackRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private StudentTopicProgressRepository topicProgressRepository;

    @GetMapping("/users/{id}/details")
    public ResponseEntity<Map<String, Object>> getUserDetails(@PathVariable Long id) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        User user = userOpt.get();
        Map<String, Object> details = new HashMap<>();
        details.put("user", user);

        if (user.getRole() == Role.STUDENT) {
            List<StudentTopicProgress> progress = topicProgressRepository.findByStudentId(id);
            details.put("topicsCompleted", progress.size());
            
            List<QuizAttempt> attempts = quizAttemptRepository.findByStudentId(id);
            details.put("quizAttempts", attempts.size());
            
            double avgScore = attempts.stream().mapToDouble(QuizAttempt::getScore).average().orElse(0.0);
            details.put("averageQuizScore", Math.round(avgScore * 10.0) / 10.0);

            details.put("enrolledCourses", courseRepository.findAll().stream().filter(c -> 
                subjectRepository.findByCourse_Id(c.getId()).stream().anyMatch(s -> 
                    topicRepository.findBySubject_Id(s.getId()).stream().anyMatch(t -> 
                        progress.stream().anyMatch(p -> p.getTopicId().equals(t.getId()))
                    )
                ) || quizRepository.findByCourseId(c.getId()).stream().anyMatch(q -> 
                    attempts.stream().anyMatch(a -> a.getQuizId().equals(q.getId()))
                )
            ).count());

            // Detailed course progress
            List<Map<String, Object>> courseProgress = courseRepository.findAll().stream().map(c -> {
                Map<String, Object> cp = new HashMap<>();
                cp.put("courseTitle", c.getTitle());
                
                // Topics in this course
                List<Subject> subjects = subjectRepository.findByCourse_Id(c.getId());
                List<Topic> topics = subjects.stream()
                    .flatMap(s -> topicRepository.findBySubject_Id(s.getId()).stream())
                    .collect(Collectors.toList());
                
                long courseTopicsTotal = topics.size();
                List<String> completedTopicNames = topics.stream()
                    .filter(t -> progress.stream().anyMatch(p -> p.getTopicId().equals(t.getId())))
                    .map(Topic::getTitle)
                    .collect(Collectors.toList());
                long courseTopicsCompleted = completedTopicNames.size();
                
                cp.put("topicsTotal", courseTopicsTotal);
                cp.put("topicsCompleted", courseTopicsCompleted);
                cp.put("completedTopicNames", completedTopicNames);
                cp.put("topicPercent", courseTopicsTotal > 0 ? Math.round((double)courseTopicsCompleted / courseTopicsTotal * 100) : 0);

                // Quizzes in this course
                List<Quiz> quizzes = quizRepository.findByCourseId(c.getId());
                long quizzesTotal = quizzes.size();
                List<String> attemptedQuizTitles = quizzes.stream()
                    .filter(q -> attempts.stream().anyMatch(a -> a.getQuizId().equals(q.getId())))
                    .map(Quiz::getTitle)
                    .collect(Collectors.toList());
                long quizzesAttempted = attemptedQuizTitles.size();
                
                cp.put("quizzesTotal", quizzesTotal);
                cp.put("quizzesAttempted", quizzesAttempted);
                cp.put("attemptedQuizTitles", attemptedQuizTitles);
                cp.put("quizPercent", quizzesTotal > 0 ? Math.round((double)quizzesAttempted / quizzesTotal * 100) : 0);

                return cp;
            }).collect(Collectors.toList());
            
            details.put("courseProgress", courseProgress);

            // Detailed quiz statistics
            List<Map<String, Object>> quizStats = attempts.stream().map(a -> {
                Map<String, Object> qs = new HashMap<>();
                quizRepository.findById(a.getQuizId()).ifPresent(q -> qs.put("quizTitle", q.getTitle()));
                qs.put("score", a.getScore());
                qs.put("completedAt", a.getAttemptTime() != null ? a.getAttemptTime().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null);
                return qs;
            }).collect(Collectors.toList());
            details.put("quizDetails", quizStats);

        } else if (user.getRole() == Role.INSTRUCTOR) {
            List<Course> createdCourses = courseRepository.findAll().stream()
                .filter(c -> id.equals(c.getInstructorId()))
                .collect(Collectors.toList());
            details.put("coursesCreated", createdCourses.size());
            
            List<Map<String, Object>> courseSummaries = createdCourses.stream().map(c -> {
                Map<String, Object> cs = new HashMap<>();
                cs.put("id", c.getId());
                cs.put("title", c.getTitle());
                cs.put("difficulty", c.getDifficultyLevel());
                cs.put("subjectsCount", subjectRepository.findByCourse_Id(c.getId()).size());
                return cs;
            }).collect(Collectors.toList());
            details.put("courseSummaries", courseSummaries);
            
        } else if (user.getRole() == Role.ADMIN) {
            // Provide some admin-specific metadata
            details.put("canManageUsers", true);
            details.put("canResolveFeedback", true);
            details.put("canManageCourses", true);
            details.put("systemPermissions", "FULL_ACCESS");
        }

        return ResponseEntity.ok(details);
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getAdminStats() {
        List<User> users = userRepository.findAll();
        long students = users.stream().filter(u -> u.getRole() == Role.STUDENT).count();
        long instructors = users.stream().filter(u -> u.getRole() == Role.INSTRUCTOR).count();
        long courses = courseRepository.count();
        long quizzes = quizRepository.count();
        long attempts = quizAttemptRepository.count();

        Map<String, Long> stats = new HashMap<>();
        stats.put("totalStudents", students);
        stats.put("totalInstructors", instructors);
        stats.put("totalCourses", courses);
        stats.put("totalQuizzes", quizzes);
        stats.put("totalQuizAttempts", attempts);
        
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        userRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/courses")
    public ResponseEntity<List<Map<String, Object>>> getAllCourses() {
        List<Course> courses = courseRepository.findAll();
        List<Map<String, Object>> result = courses.stream().map(c -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", c.getId());
            map.put("title", c.getTitle());
            map.put("instructorId", c.getInstructorId());
            map.put("difficultyLevel", c.getDifficultyLevel());
            long subjectCount = subjectRepository.findAll().stream().filter(s -> s.getCourse().getId().equals(c.getId())).count();
            map.put("subjectsCount", subjectCount);
            long quizCount = quizRepository.findByCourseId(c.getId()).size();
            map.put("quizzesCount", quizCount);
            return map;
        }).toList();
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/courses/{id}")
    public ResponseEntity<?> deleteCourse(@PathVariable Long id) {
        if (!courseRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        courseRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/feedback")
    public ResponseEntity<List<Map<String, Object>>> getAllFeedback() {
        List<Feedback> feedbacks = feedbackRepository.findAll();
        List<Map<String, Object>> result = feedbacks.stream().map(f -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", f.getId());
            map.put("userId", f.getUserId());
            map.put("content", f.getContent());
            map.put("rating", f.getRating());
            map.put("type", f.getType());
            map.put("courseId", f.getCourseId());
            map.put("subjectId", f.getSubjectId());
            map.put("topicId", f.getTopicId());
            map.put("instructorId", f.getInstructorId());
            map.put("specificPurpose", f.getSpecificPurpose());
            map.put("status", f.getStatus());
            map.put("createdAt", f.getCreatedAt());

            userRepository.findById(f.getUserId()).ifPresentOrElse(u -> {
                map.put("userName", u.getName());
                map.put("userRole", u.getRole().toString());
            }, () -> {
                map.put("userRole", "STUDENT");
            });

            if (f.getCourseId() != null) {
                courseRepository.findById(f.getCourseId()).ifPresent(c -> map.put("courseName", c.getTitle()));
            }
            if (f.getSubjectId() != null) {
                subjectRepository.findById(f.getSubjectId()).ifPresent(s -> map.put("subjectName", s.getName()));
            }
            if (f.getTopicId() != null) {
                topicRepository.findById(f.getTopicId()).ifPresent(t -> map.put("topicName", t.getTitle()));
            }
            if (f.getInstructorId() != null) {
                userRepository.findById(f.getInstructorId()).ifPresent(u -> map.put("instructorName", u.getName()));
            }

            return map;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @PutMapping("/feedback/{id}/resolve")
    public ResponseEntity<?> resolveFeedback(@PathVariable Long id) {
        Optional<Feedback> feedbackOpt = feedbackRepository.findById(id);
        if (feedbackOpt.isPresent()) {
            Feedback feedback = feedbackOpt.get();
            feedback.setStatus("RESOLVED");
            feedbackRepository.save(feedback);
            return ResponseEntity.ok(feedback);
        }
        return ResponseEntity.notFound().build();
    }
}
