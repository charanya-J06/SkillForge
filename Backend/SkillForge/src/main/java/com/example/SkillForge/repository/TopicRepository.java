package com.example.SkillForge.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.SkillForge.entity.Topic;

import java.util.List;

public interface TopicRepository extends JpaRepository<Topic,Long>{

    List<Topic> findBySubject_Id(Long subjectId);

}