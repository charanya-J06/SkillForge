package com.example.SkillForge.controller;

import com.example.SkillForge.dto.TopicDTO;
import com.example.SkillForge.entity.Topic;
import com.example.SkillForge.entity.Subject;
import com.example.SkillForge.repository.TopicRepository;
import com.example.SkillForge.repository.SubjectRepository;
import com.example.SkillForge.storage.FileStorageService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/instructor/topics")
public class TopicController {

    @Autowired
    private TopicRepository topicRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private FileStorageService fileStorageService;

    @PostMapping
    public TopicDTO createTopic(
            @RequestParam String title,
            @RequestParam Long subjectId,
            @RequestParam(required = false) MultipartFile video,
            @RequestParam(required = false) String youtubeUrl,
            @RequestParam(required = false) MultipartFile pdf,
            @RequestParam(required = false) String externalLink
    ) throws Exception {

        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new RuntimeException("Subject not found"));

        Topic topic = new Topic();
        topic.setTitle(title);
        topic.setSubject(subject);
        topic.setExternalLink(externalLink);

        if (video != null && !video.isEmpty()) {
            String videoUrl = fileStorageService.saveFile(video);
            topic.setVideoUrl(videoUrl);
        }

        if (youtubeUrl != null && !youtubeUrl.isBlank()) {
            topic.setYoutubeUrl(youtubeUrl.trim());
        }

        if (pdf != null && !pdf.isEmpty()) {
            String pdfUrl = fileStorageService.saveFile(pdf);
            topic.setPdfUrl(pdfUrl);
        }

        Topic savedTopic = topicRepository.save(topic);

        return new TopicDTO(
                savedTopic.getId(),
                savedTopic.getTitle(),
                savedTopic.getVideoUrl(),
                savedTopic.getYoutubeUrl(),
                savedTopic.getPdfUrl(),
                savedTopic.getExternalLink()
        );
    }

    @GetMapping
    public List<Topic> getTopics(@RequestParam Long subjectId){
        return topicRepository.findBySubject_Id(subjectId);
    }

    @PutMapping("/{id}")
    public TopicDTO updateTopic(@PathVariable Long id, @RequestBody java.util.Map<String, Object> body) {
        Topic existing = topicRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Topic not found"));
        if (body.containsKey("title") && body.get("title") != null)
            existing.setTitle(body.get("title").toString());
        if (body.containsKey("youtubeUrl"))
            existing.setYoutubeUrl(body.get("youtubeUrl") != null ? body.get("youtubeUrl").toString() : null);
        if (body.containsKey("externalLink"))
            existing.setExternalLink(body.get("externalLink") != null ? body.get("externalLink").toString() : null);
        Topic saved = topicRepository.save(existing);
        return new TopicDTO(
                saved.getId(),
                saved.getTitle(),
                saved.getVideoUrl(),
                saved.getYoutubeUrl(),
                saved.getPdfUrl(),
                saved.getExternalLink()
        );
    }

    @PutMapping(value = "/{id}/materials", consumes = "multipart/form-data")
    public TopicDTO updateTopicMaterials(
            @PathVariable Long id,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String externalLink,
            @RequestParam(required = false) String youtubeUrl,
            @RequestParam(required = false) MultipartFile video,
            @RequestParam(required = false) MultipartFile pdf
    ) throws Exception {
        Topic existing = topicRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Topic not found"));

        if (title != null && !title.isBlank()) existing.setTitle(title);
        if (externalLink != null) existing.setExternalLink(externalLink);
        if (youtubeUrl != null) existing.setYoutubeUrl(youtubeUrl.isBlank() ? null : youtubeUrl.trim());

        if (video != null && !video.isEmpty()) {
            String videoUrl = fileStorageService.saveFile(video);
            existing.setVideoUrl(videoUrl);
        }
        if (pdf != null && !pdf.isEmpty()) {
            String pdfUrl = fileStorageService.saveFile(pdf);
            existing.setPdfUrl(pdfUrl);
        }

        Topic saved = topicRepository.save(existing);
        return new TopicDTO(
                saved.getId(),
                saved.getTitle(),
                saved.getVideoUrl(),
                saved.getYoutubeUrl(),
                saved.getPdfUrl(),
                saved.getExternalLink()
        );
    }

    @DeleteMapping("/{id}")
    public void deleteTopic(@PathVariable Long id) {
        topicRepository.deleteById(id);
    }
}
