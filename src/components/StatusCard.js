import React, { useState, useEffect } from "react";
import { Box, Text, Flex, Spinner } from "@chakra-ui/react";

// StatusCard can take either a dataSource array or a dataUrl to fetch from
function StatusCard({ title, dataSource, dataUrl }) {
  const [data, setData] = useState(dataSource || []);
  const [loading, setLoading] = useState(!!dataUrl);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    if (!dataUrl) return;
    setLoading(true);
    setError(null);
    async function load() {
      try {
        const res = await fetch(dataUrl);
        if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
        const ct = (res.headers.get("content-type") || "").toLowerCase();
        let rows = [];
        if (ct.includes("application/json") || ct.includes("text/json")) {
          const json = await res.json();
          if (Array.isArray(json)) {
            rows = json;
          } else if (json.data) {
            rows = json.data;
          } else {
            rows = Array.isArray(Object.values(json)) ? Object.values(json) : [];
          }
        } else {
          throw new Error("Unsupported response type (not JSON)");
        }
        if (!mounted) return;
        setData(rows);
      } catch (err) {
        if (mounted) setError(String(err.message || err));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [dataUrl]);

  return (
    <Box
      bg="gray.100"
      p={6}
      borderRadius="md"
      shadow="sm"
      position="relative"
      minH="180px"
    >
      <Text position="absolute" top={3} left={4} fontSize="sm" color="gray.700">
        {title}
      </Text>
      <Flex justify="center" align="center" h="100%" gap={12}>
        {loading ? (
          <Spinner size="xl" />
        ) : error ? (
          <Text color="red.500">{error}</Text>
        ) : (
          (data || []).map((item, index) => {
            // Assign color based on label if not provided
            let color = item.color;
            if (!color) {
              const label = String(item.label || "").toLowerCase();
              if (label === "success") color = "green.600";
              else if (label === "warnings" || label === "warning") color = "orange.400";
              else if (label === "failures" || label === "failure") color = "red.600";
              else color = "gray.600";
            }
            return (
              <Box key={index} textAlign="center">
                <Text fontSize="6xl" fontWeight="bold" color={color}>
                  {item.value}
                </Text>
                <Text color="gray.600">{item.label}</Text>
              </Box>
            );
          })
        )}
      </Flex>
    </Box>
  );
}

export default StatusCard;