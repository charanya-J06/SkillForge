package com.example.SkillForge.service;

import com.example.SkillForge.dto.LoginRequest;
import com.example.SkillForge.dto.LoginResponse;
import com.example.SkillForge.dto.RegisterRequest;
import com.example.SkillForge.model.User;
import com.example.SkillForge.repository.UserRepository;
import com.example.SkillForge.config.JWTUtil;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JWTUtil jwtUtil;

    // REGISTER USER
    public String registerUser(RegisterRequest request) {
        String email = request.getEmail() == null ? "" : request.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered. Please login.");
        }

        User user = new User();

        user.setName(request.getName());
        user.setEmail(email);

        // Encrypt password
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        user.setRole(request.getRole());

        userRepository.save(user);

        return "User registered successfully!";
    }

    // LOGIN USER
    public LoginResponse loginUser(LoginRequest request) {

        Optional<User> userOptional = userRepository.findByEmail(request.getEmail());

        if (userOptional.isEmpty()) {
            throw new RuntimeException("User not found");
        }

        User user = userOptional.get();

        if (passwordEncoder.matches(request.getPassword(), user.getPassword())) {

            String token = jwtUtil.generateToken(
                    user.getEmail(),
                    user.getRole().name()
            );

            LoginResponse response = new LoginResponse();
            response.setToken(token);
            response.setRole(user.getRole().name()); // "INSTRUCTOR"/"STUDENT"
            response.setName(user.getName());
            response.setEmail(user.getEmail());
            response.setId(user.getId());

            return response;

        } else {
            throw new RuntimeException("Invalid password");
        }
    }

}