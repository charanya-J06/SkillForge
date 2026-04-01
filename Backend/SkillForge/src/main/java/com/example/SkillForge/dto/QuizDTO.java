package com.example.SkillForge.dto;

import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizDTO {
    private Long id;
    private String title;
    private Long courseId;
    private Boolean generatedByAi;
    private List<QuestionDTO> questions;
}
