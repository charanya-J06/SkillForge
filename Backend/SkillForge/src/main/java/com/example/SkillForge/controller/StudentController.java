package com.example.SkillForge.controller;

import com.example.SkillForge.dto.CourseDTO;
import com.example.SkillForge.dto.SuggestedContentDTO;
import com.example.SkillForge.entity.StudentTopicProgress;
import com.example.SkillForge.entity.Subject;
import com.example.SkillForge.entity.Topic;
import com.example.SkillForge.repository.StudentTopicProgressRepository;
import com.example.SkillForge.repository.SubjectRepository;
import com.example.SkillForge.repository.TopicRepository;
import com.example.SkillForge.service.AdaptiveLearningService;
import com.example.SkillForge.service.AnalyticsService;
import com.example.SkillForge.service.CourseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/student")
public class StudentController {

    @Autowired
    private CourseService courseService;

    @Autowired
    private AdaptiveLearningService adaptiveLearningService;

    @Autowired
    private AnalyticsService analyticsService;

    @Autowired
    private StudentTopicProgressRepository topicProgressRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private TopicRepository topicRepository;

    @GetMapping("/dashboard")
    public String studentDashboard() {
        return "Welcome to Student Dashboard";
    }

    @GetMapping("/courses")
    public List<CourseDTO> getCourses() {
        return courseService.getAllCoursesForStudent();
    }

    @GetMapping("/subjects")
    public List<Subject> getSubjects(@RequestParam Long courseId) {
        return subjectRepository.findByCourse_Id(courseId);
    }

    @GetMapping("/topics")
    public List<Topic> getTopics(@RequestParam Long subjectId) {
        return topicRepository.findBySubject_Id(subjectId);
    }

    @GetMapping("/suggestions")
    public List<SuggestedContentDTO> getSuggestions(@RequestParam Long studentId) {
        return adaptiveLearningService.getSuggestions(studentId);
    }

    @GetMapping("/analytics")
    public Map<String, Object> getAnalytics(@RequestParam Long studentId) {
        return analyticsService.getStudentAnalytics(studentId);
    }

    @GetMapping("/analytics/course")
    public Map<String, Object> getAnalyticsByCourse(@RequestParam Long studentId, @RequestParam Long courseId) {
        return analyticsService.getStudentAnalyticsForCourse(studentId, courseId);
    } 

    @PostMapping("/topic-complete")
    public String markTopicComplete(@RequestParam Long studentId, @RequestParam Long topicId) {
        if (topicProgressRepository.findByStudentIdAndTopicId(studentId, topicId).isEmpty()) {
            StudentTopicProgress progress = StudentTopicProgress.builder()
                .studentId(studentId)
                .topicId(topicId)
                .completedAt(LocalDateTime.now())
                .build();
            topicProgressRepository.save(progress);
        }
        return "OK";
    }

    @GetMapping("/topic-progress")
    public List<Long> getCompletedTopics(@RequestParam Long studentId) {
        return topicProgressRepository.findByStudentId(studentId).stream()
                .map(StudentTopicProgress::getTopicId)
                .collect(Collectors.toList());
    }
}
