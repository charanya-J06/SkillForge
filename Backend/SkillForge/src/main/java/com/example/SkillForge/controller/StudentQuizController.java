package com.example.SkillForge.controller;

import com.example.SkillForge.dto.QuizAttemptRequest;
import com.example.SkillForge.dto.QuizAttemptResponse;
import com.example.SkillForge.dto.QuizDTO;
import com.example.SkillForge.service.QuizAttemptService;
import com.example.SkillForge.service.QuizService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/student")
public class StudentQuizController {

    @Autowired
    private QuizService quizService;

    @Autowired
    private QuizAttemptService quizAttemptService;

    @GetMapping("/quizzes")
    public List<QuizDTO> getQuizzesByCourse(@RequestParam Long courseId) {
        return quizService.getQuizzesByCourse(courseId);
    }

    @GetMapping("/quizzes/{quizId}")
    public QuizDTO getQuiz(@PathVariable Long quizId) {
        return quizService.getQuizById(quizId);
    }

    @PostMapping("/quizzes/attempt")
    public QuizAttemptResponse submitAttempt(@RequestBody QuizAttemptRequest request) {
        return quizAttemptService.submitAttempt(request);
    }

    @GetMapping("/attempts")
    public List<QuizAttemptResponse> getMyAttempts(@RequestParam Long studentId) {
        return quizAttemptService.getAttemptsByStudent(studentId);
    }

    @GetMapping("/attempts/{attemptId}/review")
    public com.example.SkillForge.dto.QuizAttemptReviewDTO getAttemptReview(@PathVariable Long attemptId) {
        return quizAttemptService.getAttemptReview(attemptId);
    }
}
