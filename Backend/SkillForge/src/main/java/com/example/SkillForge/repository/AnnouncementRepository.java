package com.example.SkillForge.repository;

import com.example.SkillForge.entity.Announcement;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {
    
    @Query("SELECT a FROM Announcement a WHERE a.targetUserId = :userId OR (a.targetUserId IS NULL AND a.targetRole IN :roles) ORDER BY a.createdAt DESC")
    List<Announcement> findAnnouncementsForUser(@Param("roles") List<String> roles, @Param("userId") Long userId);
}
