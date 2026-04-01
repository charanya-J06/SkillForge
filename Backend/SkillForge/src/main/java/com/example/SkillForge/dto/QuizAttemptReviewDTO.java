package com.example.SkillForge.dto;

import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizAttemptReviewDTO {
    private Long attemptId;
    private Long quizId;
    private Double score;
    private Integer correctCount;
    private Integer totalQuestions;
    private List<QuestionReviewDTO> questions;
}
