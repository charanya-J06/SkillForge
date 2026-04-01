package com.example.SkillForge.controller;

import com.example.SkillForge.dto.FeedbackDTO;
import com.example.SkillForge.service.FeedbackService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/feedback")
public class FeedbackController {

    @Autowired
    private FeedbackService feedbackService;
    
    @PostMapping
    public FeedbackDTO submitFeedback(@RequestBody FeedbackDTO dto) {
        return feedbackService.submitFeedback(dto);
    }
    
    @GetMapping
    public List<FeedbackDTO> getAllFeedback() {
        return feedbackService.getAllFeedback();
    }
    
    @PutMapping("/{id}/resolve")
    public FeedbackDTO resolveFeedback(@PathVariable Long id) {
        return feedbackService.resolveFeedback(id);
    }
}
