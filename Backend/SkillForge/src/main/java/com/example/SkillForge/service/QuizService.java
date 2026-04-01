package com.example.SkillForge.service;

import com.example.SkillForge.dto.QuestionDTO;
import com.example.SkillForge.dto.QuizDTO;
import com.example.SkillForge.entity.Question;
import com.example.SkillForge.entity.Quiz;
import com.example.SkillForge.repository.QuestionRepository;
import com.example.SkillForge.repository.QuizRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class QuizService {

    @Autowired
    private QuizRepository quizRepository;

    @Autowired
    private QuestionRepository questionRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public List<QuizDTO> getQuizzesByCourse(Long courseId) {
        return quizRepository.findByCourseId(courseId).stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    public QuizDTO getQuizById(Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
            .orElseThrow(() -> new RuntimeException("Quiz not found"));
        return toDTO(quiz);
    }

    @Transactional
    public QuizDTO saveQuiz(String title, Long courseId, boolean generatedByAi, List<QuestionDTO> questionDTOs) {
        Quiz quiz = Quiz.builder()
            .title(title)
            .courseId(courseId)
            .generatedByAi(generatedByAi)
            .build();
        quiz = quizRepository.save(quiz);

        List<Question> questions = new ArrayList<>();
        for (QuestionDTO dto : questionDTOs) {
            String optionsJson = toJsonOptions(dto.getOptions());
            Question q = Question.builder()
                .questionText(dto.getQuestionText())
                .options(optionsJson)
                .correctAnswer(dto.getCorrectAnswer() != null ? dto.getCorrectAnswer().trim() : "A")
                .questionType(dto.getQuestionType() != null ? dto.getQuestionType() : "MCQ")
                .quiz(quiz)
                .build();
            questions.add(questionRepository.save(q));
        }
        quiz.setQuestions(questions);
        return toDTO(quiz);
    }

    public void deleteQuiz(Long quizId) {
        quizRepository.deleteById(quizId);
    }

    private QuizDTO toDTO(Quiz quiz) {
        List<QuestionDTO> questionDTOs = new ArrayList<>();
        if (quiz.getQuestions() != null) {
            for (Question q : quiz.getQuestions()) {
                questionDTOs.add(QuestionDTO.builder()
                    .id(q.getId())
                    .questionText(q.getQuestionText())
                    .options(parseOptions(q.getOptions()))
                    .correctAnswer(q.getCorrectAnswer())
                    .questionType(q.getQuestionType())
                    .build());
            }
        }
        return QuizDTO.builder()
            .id(quiz.getId())
            .title(quiz.getTitle())
            .courseId(quiz.getCourseId())
            .generatedByAi(quiz.getGeneratedByAi())
            .questions(questionDTOs)
            .build();
    }

    private String toJsonOptions(List<String> options) {
        if (options == null || options.isEmpty()) return "[]";
        try {
            return objectMapper.writeValueAsString(options);
        } catch (JsonProcessingException e) {
            return "[]";
        }
    }

    private List<String> parseOptions(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return List.of();
        }
    }
}
