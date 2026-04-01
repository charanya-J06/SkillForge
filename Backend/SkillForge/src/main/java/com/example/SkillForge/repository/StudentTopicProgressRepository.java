package com.example.SkillForge.repository;

import com.example.SkillForge.entity.StudentTopicProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudentTopicProgressRepository extends JpaRepository<StudentTopicProgress, Long> {

    List<StudentTopicProgress> findByStudentId(Long studentId);

    Optional<StudentTopicProgress> findByStudentIdAndTopicId(Long studentId, Long topicId);

    List<StudentTopicProgress> findByTopicIdIn(List<Long> topicIds);
}
