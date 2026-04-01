// src/main/java/com/example/SkillForge/dto/GenerateQuizRequest.java
package com.example.SkillForge.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GenerateQuizRequest {
    private String topic;
    private Long courseId;
    private String title;
    private Integer numQuestions;
    private String difficultyLevel;
}
