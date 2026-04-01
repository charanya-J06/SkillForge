package com.example.SkillForge.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SuggestedContentDTO {
    private String type; // TOPIC, QUIZ
    private Long id;
    private String title;
    private String reason;
    private String difficultyLevel;
    private Long courseId;
    private String courseName;
    private Long subjectId;
}
