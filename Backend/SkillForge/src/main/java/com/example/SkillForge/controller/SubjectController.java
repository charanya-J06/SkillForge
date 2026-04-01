package com.example.SkillForge.controller;

import com.example.SkillForge.entity.Subject;
import com.example.SkillForge.entity.Course;
import com.example.SkillForge.repository.SubjectRepository;
import com.example.SkillForge.repository.CourseRepository;
import com.example.SkillForge.dto.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/instructor/subjects")
public class SubjectController {

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private CourseRepository courseRepository;

    @PostMapping
    public Subject createSubject(@RequestBody SubjectRequestDTO request) {

        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new RuntimeException("Course not found"));

        Subject subject = new Subject();
        subject.setName(request.getName());
        subject.setCourse(course);

        return subjectRepository.save(subject);
    }

    // SubjectController
    @PutMapping("/{id}")
    public Subject updateSubject(@PathVariable Long id, @RequestBody Subject updated) {
        Subject existing = subjectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Subject not found"));
        existing.setName(updated.getName());
        return subjectRepository.save(existing);
    }


    @GetMapping
    public List<Subject> getSubjects(@RequestParam Long courseId){
        return subjectRepository.findByCourse_Id(courseId);
    }

    @DeleteMapping("/{id}")
    public void deleteSubject(@PathVariable Long id) {
        subjectRepository.deleteById(id);
    }
}