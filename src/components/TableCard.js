import React from "react";
import { Box, Text } from "@chakra-ui/react";

function TableCard({ title, children }) {
  return (
    <Box
      bg="gray.100"
      p={6}
      borderRadius="md"
      shadow="sm"
      position="relative"
      minH="180px"
      overflowX="auto"
    >
      <Text position="absolute" top={3} left={4} fontSize="sm" color="gray.700">
        {title}
      </Text>
      <Box mt={8}>{children}</Box>
    </Box>
  );
}

export default TableCard;
