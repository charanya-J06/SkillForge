package com.example.SkillForge.service;

import com.example.SkillForge.dto.CourseDTO;
import com.example.SkillForge.entity.Course;
import com.example.SkillForge.repository.CourseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CourseService {

    @Autowired
    private CourseRepository courseRepository;

    public List<CourseDTO> getInstructorCourses(Long instructorId) {
        List<Course> courses = courseRepository.findByInstructorId(instructorId);
        return courses.stream()
                .map(course -> new CourseDTO(
                        course.getId(),
                        course.getTitle(),
                        course.getDifficultyLevel()
                ))
                .collect(Collectors.toList());
    }

    public List<CourseDTO> getAllCoursesForStudent() {
        return courseRepository.findAll().stream()
                .map(course -> new CourseDTO(
                        course.getId(),
                        course.getTitle(),
                        course.getDifficultyLevel()
                ))
                .collect(Collectors.toList());
    }
}