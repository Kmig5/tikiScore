package com.tikiscore_server.forum.dto;

import java.util.List;

public record DiscussionPageResponse(List<DiscussionResponse> content, int page, int size,
                                     long totalElements, int totalPages) {
}