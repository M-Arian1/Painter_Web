package com.example.painterbackend;

import com.example.painterbackend.entity.User;
import com.example.painterbackend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class PainterBackendApplication implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    public static void main(String[] args) {
        SpringApplication.run(PainterBackendApplication.class, args);
    }

    @Override
    public void run(String... args) throws Exception {
        // Create default users (if none exist!!)
        if (userRepository.count() == 0) {
            userRepository.save(new User("admin", "admin123"));
            userRepository.save(new User("user1", "password1"));
            userRepository.save(new User("user2", "password2"));
            userRepository.save(new User("artist", "paint123"));
            
            System.out.println("Default users created:");
            System.out.println("admin / admin123");
            System.out.println("user1 / password1");
            System.out.println("user2 / password2");
            System.out.println("artist / paint123");
        }
    }
}
