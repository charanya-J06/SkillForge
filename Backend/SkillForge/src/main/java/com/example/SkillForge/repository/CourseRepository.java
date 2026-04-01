package com.example.SkillForge.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.SkillForge.entity.Course;

import java.util.List;

public interface CourseRepository extends JpaRepository<Course,Long> {

    List<Course> findByInstructorId(Long instructorId);

}