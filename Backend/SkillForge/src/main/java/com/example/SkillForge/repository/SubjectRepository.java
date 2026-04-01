package com.example.SkillForge.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.SkillForge.entity.Subject;

import java.util.List;

public interface SubjectRepository extends JpaRepository<Subject,Long>{

    List<Subject> findByCourse_Id(Long courseId);

}