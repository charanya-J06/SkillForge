package com.example.SkillForge.dto;

import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionDTO {
    private Long id;
    private String questionText;
    private List<String> options;
    private String correctAnswer;
    private String questionType;
}
