package com.example.SkillForge.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizAttemptResponse {
    private Long attemptId;
    private Long quizId;
    private Double score;
    private Integer correctCount;
    private Integer totalQuestions;
    private Integer timeSpentSeconds;
    private LocalDateTime attemptTime;
}
