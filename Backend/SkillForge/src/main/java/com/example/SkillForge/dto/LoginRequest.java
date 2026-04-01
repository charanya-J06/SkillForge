// src/main/java/com/example/SkillForge/dto/LoginRequest.java
package com.example.SkillForge.dto;

import lombok.Data;

@Data
public class LoginRequest {
    private String email;
    private String password;
}
