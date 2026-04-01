package com.example.SkillForge.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "feedback")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Feedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(columnDefinition = "TEXT")
    private String content;

    private Integer rating;

    @Column(name = "feedback_type")
    private String type; // PLATFORM, COURSE, INSTRUCTOR

    @Column(name = "course_id")
    private Long courseId;

    @Column(name = "subject_id")
    private Long subjectId;

    @Column(name = "topic_id")
    private Long topicId;

    @Column(name = "instructor_id")
    private Long instructorId;

    @Column(name = "specific_purpose")
    private String specificPurpose; // For instructor feedback (Student Performance, etc.)

    private String status; // PENDING, RESOLVED

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
