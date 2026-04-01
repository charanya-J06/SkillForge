package com.example.SkillForge.controller;

import com.example.SkillForge.entity.Announcement;
import com.example.SkillForge.repository.AnnouncementRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/announcements")
@CrossOrigin(origins = "http://localhost:3000")
public class AnnouncementController {

    @Autowired
    private AnnouncementRepository announcementRepository;

    @GetMapping
    public ResponseEntity<List<Announcement>> getAnnouncements(@RequestParam String role, @RequestParam Long userId) {
        List<String> targetRoles = Arrays.asList("ALL", role);
        return ResponseEntity.ok(announcementRepository.findAnnouncementsForUser(targetRoles, userId));
    }

    @PostMapping("/admin")
    public ResponseEntity<Announcement> createAnnouncement(@RequestBody Announcement announcement) {
        announcement.setCreatedAt(LocalDateTime.now());
        return ResponseEntity.ok(announcementRepository.save(announcement));
    }
    
    @GetMapping("/admin")
    public ResponseEntity<List<Announcement>> getAllAnnouncements() {
        return ResponseEntity.ok(announcementRepository.findAll());
    }
    
    @DeleteMapping("/admin/{id}")
    public ResponseEntity<?> deleteAnnouncement(@PathVariable Long id) {
        if (!announcementRepository.existsById(id)) return ResponseEntity.notFound().build();
        announcementRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
