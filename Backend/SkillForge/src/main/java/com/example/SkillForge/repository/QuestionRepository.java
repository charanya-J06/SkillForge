package com.example.SkillForge.repository;

import com.example.SkillForge.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuestionRepository extends JpaRepository<Question, Long> {

    List<Question> findByQuiz_Id(Long quizId);
}
