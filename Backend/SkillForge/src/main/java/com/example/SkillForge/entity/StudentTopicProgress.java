package com.example.SkillForge.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "student_topic_progress", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"student_id", "topic_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentTopicProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id")
    private Long studentId;

    @Column(name = "topic_id")
    private Long topicId;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "self_rating")
    private Integer selfRating;
}
