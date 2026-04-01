package com.example.SkillForge.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionReviewDTO {
    private Long questionId;
    private String questionText;
    private String options;
    private String correctAnswer;
    private String userAnswer;
    private String explanation;
    private Boolean isCorrect;
}
