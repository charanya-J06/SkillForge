package com.example.SkillForge.service;

import com.example.SkillForge.dto.QuizAttemptRequest;
import com.example.SkillForge.dto.QuizAttemptResponse;
import com.example.SkillForge.entity.Question;
import com.example.SkillForge.entity.Quiz;
import com.example.SkillForge.entity.QuizAttempt;
import com.example.SkillForge.repository.QuestionRepository;
import com.example.SkillForge.repository.QuizAttemptRepository;
import com.example.SkillForge.repository.QuizRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class QuizAttemptService {

    @Autowired
    private QuizAttemptRepository attemptRepository;

    @Autowired
    private QuizRepository quizRepository;

    @Autowired
    private QuestionRepository questionRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional
    public QuizAttemptResponse submitAttempt(QuizAttemptRequest request) {
        Quiz quiz = quizRepository.findById(request.getQuizId())
            .orElseThrow(() -> new RuntimeException("Quiz not found"));
        List<Question> questions = questionRepository.findByQuiz_Id(quiz.getId());
        int total = questions.size();
        int correct = 0;
        for (Question q : questions) {
            String userAnswer = request.getAnswers() != null ? request.getAnswers().get(q.getId()) : null;
            if (userAnswer != null && isCorrect(q, userAnswer)) {
                correct++;
            }
        }
        double score = total > 0 ? (100.0 * correct / total) : 0;

        String answersJsonLocal = null;
        try {
            answersJsonLocal = objectMapper.writeValueAsString(request.getAnswers());
        } catch (Exception e) {}

        QuizAttempt attempt = QuizAttempt.builder()
            .quizId(request.getQuizId())
            .studentId(request.getStudentId())
            .score(score)
            .attemptTime(LocalDateTime.now())
            .timeSpentSeconds(request.getTimeSpentSeconds() != null ? request.getTimeSpentSeconds() : 0)
            .totalQuestions(total)
            .correctCount(correct)
            .answersJson(answersJsonLocal)
            .build();
        attempt = attemptRepository.save(attempt);

        return QuizAttemptResponse.builder()
            .attemptId(attempt.getId())
            .quizId(attempt.getQuizId())
            .score(score)
            .correctCount(correct)
            .totalQuestions(total)
            .timeSpentSeconds(attempt.getTimeSpentSeconds())
            .attemptTime(attempt.getAttemptTime())
            .build();
    }

    private boolean isCorrect(Question q, String userAnswer) {
        String correct = q.getCorrectAnswer();
        if (correct == null) return false;
        correct = correct.trim().toUpperCase();
        userAnswer = userAnswer.trim().toUpperCase();
        if (correct.length() == 1 && userAnswer.length() == 1) {
            return correct.equals(userAnswer);
        }
        return correct.equalsIgnoreCase(userAnswer);
    }

    public List<QuizAttemptResponse> getAttemptsByStudent(Long studentId) {
        return attemptRepository.findByStudentIdOrderByAttemptTimeDesc(studentId,
                PageRequest.of(0, 50))
            .stream()
            .map(this::toResponse)
            .toList();
    }

    private QuizAttemptResponse toResponse(QuizAttempt a) {
        return QuizAttemptResponse.builder()
            .attemptId(a.getId())
            .quizId(a.getQuizId())
            .score(a.getScore())
            .correctCount(a.getCorrectCount())
            .totalQuestions(a.getTotalQuestions())
            .timeSpentSeconds(a.getTimeSpentSeconds())
            .attemptTime(a.getAttemptTime())
            .build();
    }

    public com.example.SkillForge.dto.QuizAttemptReviewDTO getAttemptReview(Long attemptId) {
        QuizAttempt attempt = attemptRepository.findById(attemptId)
            .orElseThrow(() -> new RuntimeException("Attempt not found"));
        Quiz quiz = quizRepository.findById(attempt.getQuizId())
            .orElseThrow(() -> new RuntimeException("Quiz not found"));
        List<Question> questions = questionRepository.findByQuiz_Id(quiz.getId());
        
        java.util.Map<Long, String> answersMap = new java.util.HashMap<>();
        if (attempt.getAnswersJson() != null && !attempt.getAnswersJson().isEmpty()) {
            try {
                answersMap = objectMapper.readValue(attempt.getAnswersJson(), new TypeReference<java.util.Map<Long, String>>() {});
            } catch (Exception e) {}
        }
        
        List<com.example.SkillForge.dto.QuestionReviewDTO> reviewQuestions = new java.util.ArrayList<>();
        for (Question q : questions) {
            String userAnswer = answersMap.get(q.getId());
            boolean isCorrect = userAnswer != null && isCorrect(q, userAnswer);
            reviewQuestions.add(com.example.SkillForge.dto.QuestionReviewDTO.builder()
                .questionId(q.getId())
                .questionText(q.getQuestionText())
                .options(q.getOptions())
                .correctAnswer(q.getCorrectAnswer())
                .userAnswer(userAnswer)
                .explanation(q.getExplanation())
                .isCorrect(isCorrect)
                .build());
        }
        
        return com.example.SkillForge.dto.QuizAttemptReviewDTO.builder()
            .attemptId(attempt.getId())
            .quizId(quiz.getId())
            .score(attempt.getScore())
            .correctCount(attempt.getCorrectCount())
            .totalQuestions(attempt.getTotalQuestions())
            .questions(reviewQuestions)
            .build();
    }
}
