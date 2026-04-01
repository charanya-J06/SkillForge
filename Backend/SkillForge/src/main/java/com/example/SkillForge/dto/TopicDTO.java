package com.example.SkillForge.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TopicDTO {

    private Long id;
    private String title;
    private String videoUrl;
    private String youtubeUrl;
    private String pdfUrl;
    private String externalLink;
}