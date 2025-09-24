import React from "react";
import { Box, Flex } from "@chakra-ui/react";

export default function PlanTypeVersionBox({ srcPlan, srcVersion, tgtPlan, tgtVersion }) {
  return (
    <Flex justify="center" align="center" mt={4}>
      <Box 
        borderWidth="1px" 
        borderRadius="md" 
        p={2} 
        bg="white" 
        boxShadow="md" 
        width="400px" // Adjusted width to make the box smaller
      >
        <table style={{ textAlign: "center", width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f7f7f7" }}>
              <th style={{ padding: "6px", fontSize: "xs", color: "gray.800", borderBottom: "1px solid #e2e8f0" }}></th>
              <th style={{ padding: "6px", fontSize: "xs", color: "gray.800", borderBottom: "1px solid #e2e8f0" }}>Plan Type</th>
              <th style={{ padding: "6px", fontSize: "xs", color: "gray.800", borderBottom: "1px solid #e2e8f0" }}>Version</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: "6px", fontSize: "xs", color: "gray.600", borderBottom: "1px solid #e2e8f0" }}>Source</td>
              <td style={{ padding: "6px", fontSize: "xs", color: "gray.600", borderBottom: "1px solid #e2e8f0" }}>{srcPlan}</td>
              <td style={{ padding: "6px", fontSize: "xs", color: "gray.600", borderBottom: "1px solid #e2e8f0" }}>{srcVersion}</td>
            </tr>
            <tr>
              <td style={{ padding: "6px", fontSize: "xs", color: "gray.600", borderBottom: "1px solid #e2e8f0" }}>Target</td>
              <td style={{ padding: "6px", fontSize: "xs", color: "gray.600", borderBottom: "1px solid #e2e8f0" }}>{tgtPlan}</td>
              <td style={{ padding: "6px", fontSize: "xs", color: "gray.600", borderBottom: "1px solid #e2e8f0" }}>{tgtVersion}</td>
            </tr>
          </tbody>
        </table>
      </Box>
    </Flex>
  );
}