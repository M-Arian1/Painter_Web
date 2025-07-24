package com.example.painterbackend.controller;

import com.example.painterbackend.entity.User;
import com.example.painterbackend.entity.Painting;
import com.example.painterbackend.repository.UserRepository;
import com.example.painterbackend.repository.PaintingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000")
public class PainterController {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PaintingRepository paintingRepository;
    
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginData) {
        String username = loginData.get("username");
        String password = loginData.get("password");
        
        Optional<User> user = userRepository.findByUsernameAndPassword(username, password);
        if (user.isPresent()) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("userId", user.get().getId());
            response.put("username", user.get().getUsername());
            return ResponseEntity.ok(response);
        } else {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Invalid username or password");
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @GetMapping("/painting/{userId}")
    public ResponseEntity<?> getPainting(@PathVariable Long userId) {
        Optional<Painting> painting = paintingRepository.findByUserId(userId);
        Map<String, Object> response = new HashMap<>();
        
        if (painting.isPresent()) {
            response.put("title", painting.get().getTitle());
            response.put("shapesData", painting.get().getShapesData());
        } else {
            response.put("title", "New Painting");
            response.put("shapesData", "[]");
        }
        
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/painting")
    public ResponseEntity<?> savePainting(@RequestBody Map<String, Object> paintingData) {
        Long userId = Long.valueOf(paintingData.get("userId").toString());
        String title = paintingData.get("title").toString();
        String shapesData = paintingData.get("shapesData").toString();
        
        Optional<Painting> existingPainting = paintingRepository.findByUserId(userId);
        
        Painting painting;
        if (existingPainting.isPresent()) {
            painting = existingPainting.get();
            painting.setTitle(title);
            painting.setShapesData(shapesData);
            painting.setUpdatedAt(System.currentTimeMillis());
        } else {
            painting = new Painting(userId, title, shapesData);
        }
        
        paintingRepository.save(painting);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Painting saved successfully");
        
        return ResponseEntity.ok(response);
    }
}