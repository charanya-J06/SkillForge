package com.example.SkillForge.controller;

import com.example.SkillForge.entity.Course;
import com.example.SkillForge.repository.CourseRepository;
import com.example.SkillForge.service.CourseService;
import com.example.SkillForge.dto.CourseDTO;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/instructor/courses")
public class CourseController {

    @Autowired
    private CourseRepository courseRepository;

    @PostMapping
    public Course createCourse(@RequestBody Course course){

        return courseRepository.save(course);
    }

    // CourseController
    @PutMapping("/{id}")
    public Course updateCourse(@PathVariable Long id, @RequestBody Course updated) {
        Course existing = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        existing.setTitle(updated.getTitle());
        existing.setDifficultyLevel(updated.getDifficultyLevel());
        return courseRepository.save(existing);
    }


    @Autowired
    private CourseService courseService;

    @GetMapping
    public List<CourseDTO> getCourses(@RequestParam Long instructorId){
        return courseService.getInstructorCourses(instructorId);
    }

    @DeleteMapping("/{id}")
    public void deleteCourse(@PathVariable Long id){

        courseRepository.deleteById(id);
    }
}