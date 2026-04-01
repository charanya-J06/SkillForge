package com.example.SkillForge.service;

import com.example.SkillForge.entity.Feedback;
import com.example.SkillForge.repository.FeedbackRepository;
import com.example.SkillForge.repository.UserRepository;
import com.example.SkillForge.repository.CourseRepository;
import com.example.SkillForge.repository.SubjectRepository;
import com.example.SkillForge.repository.TopicRepository;
import com.example.SkillForge.dto.FeedbackDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class FeedbackService {
    @Autowired
    private FeedbackRepository feedbackRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private CourseRepository courseRepository;
    
    @Autowired
    private SubjectRepository subjectRepository;
    
    @Autowired
    private TopicRepository topicRepository;
    
    public FeedbackDTO submitFeedback(FeedbackDTO dto) {
        Feedback f = new Feedback();
        f.setUserId(dto.getUserId());
        f.setContent(dto.getContent());
        f.setRating(dto.getRating());
        f.setType(dto.getType());
        f.setCourseId(dto.getCourseId());
        f.setSubjectId(dto.getSubjectId());
        f.setTopicId(dto.getTopicId());
        f.setInstructorId(dto.getInstructorId());
        f.setSpecificPurpose(dto.getSpecificPurpose());
        f.setStatus("PENDING");
        f.setCreatedAt(LocalDateTime.now());
        
        f = feedbackRepository.save(f);
        dto.setId(f.getId());
        dto.setStatus(f.getStatus());
        dto.setCreatedAt(f.getCreatedAt());
        return dto;
    }
    
    public List<FeedbackDTO> getAllFeedback() {
        return feedbackRepository.findAll().stream().map(f -> {
            FeedbackDTO dto = new FeedbackDTO();
            dto.setId(f.getId());
            dto.setUserId(f.getUserId());
            dto.setContent(f.getContent());
            dto.setRating(f.getRating());
            dto.setType(f.getType());
            dto.setCourseId(f.getCourseId());
            dto.setInstructorId(f.getInstructorId());
            dto.setStatus(f.getStatus());
            dto.setCreatedAt(f.getCreatedAt());
            
            userRepository.findById(f.getUserId()).ifPresent(u -> {
                dto.setUserName(u.getName());
                dto.setUserRole(u.getRole().toString());
            });
            if (f.getCourseId() != null) {
                courseRepository.findById(f.getCourseId()).ifPresent(c -> dto.setCourseName(c.getTitle()));
            }
            if (f.getSubjectId() != null) {
                subjectRepository.findById(f.getSubjectId()).ifPresent(s -> dto.setSubjectName(s.getName()));
            }
            if (f.getTopicId() != null) {
                topicRepository.findById(f.getTopicId()).ifPresent(t -> dto.setTopicName(t.getTitle()));
            }
            if (f.getInstructorId() != null) {
                userRepository.findById(f.getInstructorId()).ifPresent(u -> dto.setInstructorName(u.getName()));
            }
            dto.setSpecificPurpose(f.getSpecificPurpose());
            return dto;
        }).collect(Collectors.toList());
    }
    
    public FeedbackDTO resolveFeedback(Long id) {
        Feedback f = feedbackRepository.findById(id).orElseThrow(() -> new RuntimeException("Feedback not found"));
        f.setStatus("RESOLVED");
        f = feedbackRepository.save(f);
        
        FeedbackDTO dto = new FeedbackDTO();
        dto.setId(f.getId());
        dto.setStatus(f.getStatus());
        return dto;
    }
}
