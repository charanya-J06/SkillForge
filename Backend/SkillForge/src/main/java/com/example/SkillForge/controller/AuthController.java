package com.example.SkillForge.controller;

import com.example.SkillForge.dto.LoginRequest;
import com.example.SkillForge.dto.LoginResponse;
import com.example.SkillForge.dto.RegisterRequest;
import com.example.SkillForge.service.AuthService;
import com.example.SkillForge.model.User;
import com.example.SkillForge.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.Map;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // REGISTER API
    @PostMapping("/register")
    public String registerUser(@Valid @RequestBody RegisterRequest request) {
        return authService.registerUser(request);
    }

    // LOGIN API
    @PostMapping("/login")
    public LoginResponse loginUser(@RequestBody LoginRequest request){
        return authService.loginUser(request);
    }

    // PROFILE UPDATE API
    @PutMapping("/profile/{id}")
    public User updateProfile(@PathVariable Long id, @RequestBody User request) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        if (request.getName() != null && !request.getName().isEmpty()) {
            user.setName(request.getName());
        }
        if (request.getEmail() != null && !request.getEmail().isEmpty()) {
            user.setEmail(request.getEmail());
        }
        return userRepository.save(user);
    }

    // PASSWORD UPDATE API
    @PutMapping("/{id}/password")
    public ResponseEntity<?> changePassword(@PathVariable Long id, @RequestBody Map<String, String> request) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        
        String oldPassword = request.get("oldPassword");
        String newPassword = request.get("newPassword");

        if (oldPassword == null || newPassword == null) {
            return ResponseEntity.badRequest().body("Passwords cannot be empty");
        }

        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Incorrect old password");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        return ResponseEntity.ok("Password changed successfully");
    }
}