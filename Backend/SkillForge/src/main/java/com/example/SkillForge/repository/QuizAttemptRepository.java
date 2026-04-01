package com.example.SkillForge.repository;

import com.example.SkillForge.entity.QuizAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.domain.Pageable;

import java.util.List;

public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {

    List<QuizAttempt> findByStudentId(Long studentId);

    List<QuizAttempt> findByQuizId(Long quizId);

    List<QuizAttempt> findByStudentIdOrderByAttemptTimeDesc(Long studentId, Pageable pageable);
}
