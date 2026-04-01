package com.example.SkillForge.dto;

import lombok.*;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizAttemptRequest {
    private Long quizId;
    private Long studentId;
    private Map<Long, String> answers;
    private Integer timeSpentSeconds;
}
