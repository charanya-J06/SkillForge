package com.example.SkillForge.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class FeedbackDTO {
    private Long id;
    private Long userId;
    private String userName;
    private String content;
    private Integer rating;
    private String type; // PLATFORM, COURSE, INSTRUCTOR
    private Long courseId;
    private String courseName;
    private Long subjectId;
    private String subjectName;
    private Long topicId;
    private String topicName;
    private Long instructorId;
    private String instructorName;
    private String specificPurpose;
    private String status;
    private String userRole;
    private LocalDateTime createdAt;

    public String getUserRole() {
        return userRole;
    }

    public void setUserRole(String userRole) {
        this.userRole = userRole;
    }
}
