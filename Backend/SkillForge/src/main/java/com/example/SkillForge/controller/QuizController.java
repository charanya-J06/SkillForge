// src/main/java/com/example/SkillForge/controller/QuizController.java
package com.example.SkillForge.controller;

import com.example.SkillForge.dto.GenerateQuizRequest;
import com.example.SkillForge.dto.QuestionDTO;
import com.example.SkillForge.dto.QuizDTO;
import com.example.SkillForge.service.GeminiQuizService;
import com.example.SkillForge.service.QuizService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/instructor/quizzes")
public class QuizController {

    @Autowired
    private GeminiQuizService geminiQuizService;

    @Autowired
    private QuizService quizService;

    @GetMapping
    public List<QuizDTO> getQuizzesByCourse(@RequestParam Long courseId) {
        return quizService.getQuizzesByCourse(courseId);
    }

    @PostMapping("/generate")
    public List<QuestionDTO> generateQuestions(@RequestBody GenerateQuizRequest request) {
        int num = request.getNumQuestions() != null && request.getNumQuestions() > 0
                ? request.getNumQuestions()
                : 5;
        String topic = (request.getTopic() != null && !request.getTopic().isBlank())
                ? request.getTopic()
                : "General Knowledge";
        String difficulty = (request.getDifficultyLevel() != null && !request.getDifficultyLevel().isBlank())
                ? request.getDifficultyLevel()
                : "BEGINNER";

        return geminiQuizService.generateQuestions(topic, num, difficulty);
    }

    @PostMapping
    public QuizDTO saveQuiz(@RequestBody QuizDTO dto) {
        return quizService.saveQuiz(
                dto.getTitle(),
                dto.getCourseId(),
                Boolean.TRUE.equals(dto.getGeneratedByAi()),
                dto.getQuestions() != null ? dto.getQuestions() : List.of()
        );
    }

    @GetMapping("/{id}")
    public QuizDTO getQuiz(@PathVariable Long id) {
        return quizService.getQuizById(id);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuiz(@PathVariable Long id) {
        quizService.deleteQuiz(id);
        return ResponseEntity.noContent().build();
    }
}
