import {
  Box,
  Flex,
  Button,
  Heading,
  SimpleGrid,
  Text,
  Stack,
  useToast,
} from "@chakra-ui/react";
// NavigateDefinition removed (parent will render it)
import SheetComponent from "./SheetComponent";
import { API_BASE_URL } from "./HomePage"; // Import the constant

import NetworkGraph from "./NetworkGraph";
import { getPayloadFromUrl } from "./o9Interfacehelper";
import React, { useState, useEffect } from "react";
import { materialDetailsDataPayload,networkMaterialRulesDataPayload } from "./payloads"
/*
  NetworkDefinitionPage
  - Dummy layout that matches the pasted image: step progress + several sheet-like boxes
  - Uses simple Chakra tables with sample rows. Replace these boxes with SheetComponent + real URLs later.
*/

export default function NetworkDefinitionPage({
  srcPlan,
  srcVersion,
  tgtPlan,
  tgtVersion,
  filters,
  onBack,
  onNext,    // injected by DefinitionWizard
  onPrev,    // injected by DefinitionWizard
  isFirst,   // injected by DefinitionWizard
  isLast,    // injected by DefinitionWizard
}) {
  const [detailsView, setDetailsView] = React.useState("table"); // "table" or "network"
  const toast = useToast();
  const [abdmRunning, setAbdmRunning] = React.useState(false);
  const [abdmCompleted, setAbdmCompleted] = React.useState(false); // New state to track if ABDM has completed

  const runAbdm = async () => {
    setAbdmRunning(true);
    try {
      const res = await fetch(`${API_BASE_URL}/docs`, { method: "GET" });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: "ABDM started", status: "success", duration: 3000 });

      // Load Material Definition - Details after ABDM is started
      await loadMaterialDetails();
      setAbdmCompleted(true); // Set completed after successful ABDM and loading
    } catch (err) {
      toast({ title: "ABDM failed", description: err.message, status: "error", duration: 5000 });
    } finally {
      setAbdmRunning(false);
    }
  };
  const [networkMaterialRulesData, setNetworkMaterialRulesData] = useState(null);
  const [networkMaterialRulesDataLoading, setNetworkMaterialRulesDataLoading] = useState(true);
  const [networkMaterialRulesDataError, setNetworkMaterialRulesDataSummaryError] = useState(null);

  // New state for Material Definition - Details loaded after running ABDM
  const [materialDetailsData, setMaterialDetailsData] = useState(null);
  const [materialDetailsLoading, setMaterialDetailsLoading] = useState(false);
  const [materialDetailsError, setMaterialDetailsError] = useState(null);

  const loadMaterialDetails = async () => {
    setMaterialDetailsLoading(true);
    setMaterialDetailsError(null);
    try {
      // const data = await getPayloadFromUrl("http://172.20.10.250:8998/read_json/material_definition_multilevels.json");
      var data = await getPayloadFromUrl({ payload : materialDetailsDataPayload});
      if (typeof data === 'string') {
          try {
            data = JSON.parse(data);
          } catch (parseError) {
            throw new Error("Failed to parse API response as JSON: " + parseError.message);
          }
        }
        if (!data || !data["Results"] || !Array.isArray(data["Results"]) || data["Results"].length === 0) {
          throw new Error("Invalid API response: Missing or empty 'Results' array");
        }
        setMaterialDetailsData(data["Results"]["0"]);
    } catch (err) {
      setMaterialDetailsError(err.message || String(err));
    } finally {
      setMaterialDetailsLoading(false);
    }
  };

  useEffect(() => {
    setNetworkMaterialRulesDataLoading(true);
    getPayloadFromUrl({payload: networkMaterialRulesDataPayload})
      .then((data) => {
        // console.log("Network summary data:",data );
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data);
          } catch (parseError) {
            throw new Error("Failed to parse API response as JSON: " + parseError.message);
          }
        }
        if (!data || !data["Results"] || !Array.isArray(data["Results"]) || data["Results"].length === 0) {
          throw new Error("Invalid API response: Missing or empty 'Results' array");
        }
        setNetworkMaterialRulesData(data["Results"]["0"]);
      })
      .catch((error) => {
        setNetworkMaterialRulesDataLoading(error.message);
      })
      .finally(() => {
        setNetworkMaterialRulesDataSummaryError(false);
      });
  }, []);
  return (
    <Box p={6}>
      <Flex mb={4} justify="space-between" align="center">
        <Flex gap={3} align="center">
          <Button size="sm" onClick={onBack}>Back</Button>
          <Heading size="md">Network Model - Definition</Heading>
        </Flex>
        <Stack spacing={0} align="flex-end">
          <Text fontSize="sm" color="gray.600">Source: {srcPlan} / {srcVersion}</Text>
          <Text fontSize="sm" color="gray.600">Target: {tgtPlan} / {tgtVersion}</Text>
        </Stack>
      </Flex>

      {/* Material Definition - Rules Section */}
      <Box w="100%" mb={6}>
        <Flex justify="space-between" align="center" mb={3}>
          <Heading size="sm">Material Definition - Rules</Heading>
          <Button
            size="sm"
            colorScheme="teal"
            onClick={runAbdm}
            isLoading={abdmRunning}
            aria-label="Run ABDM"
          >
            Run ABDM
          </Button>
        </Flex>

        <SimpleGrid columns={1} spacing={6}>
          
            <SheetComponent dataUrl={`${API_BASE_URL}/read/material_definition_rules.csv`} data={networkMaterialRulesData} />
         
        </SimpleGrid>
      </Box>

      {/* Summary of Material Definition */}
      <Box w="100%" mb={6}>
        <Heading size="sm" mb={3}>
            Material Definition
        </Heading>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} w="100%">
            <SheetComponent dataUrl={`${API_BASE_URL}/read/summary_definition1.csv`} enableEdit={false} />
            <SheetComponent dataUrl={`${API_BASE_URL}/read/summary_definition2.csv`} enableEdit={false} />
        </SimpleGrid>
      </Box>

      {/* Material Definition - Details (toggle Table / Network) - Only visible after ABDM */}
      {abdmCompleted && (
        <Box w="100%" mb={6}>
          <Flex justify="space-between" align="center" mb={3}>
            <Heading size="sm">Material Definition - Details</Heading>
          </Flex>

         
            <SimpleGrid columns={1} spacing={6}>
                <SheetComponent
                  data={materialDetailsData}
                  isLoading={materialDetailsLoading}
                  error={materialDetailsError}
                  config = {{ enabled: true, levelDimension: 'Level', targetDimension: 'Item' }}
                />
            </SimpleGrid>
        </Box>
      )}

      {/* Page-level navigation */}
      <Flex mt={4} gap={2} justify="flex-end">
        <Button size="sm" onClick={onPrev} isDisabled={isFirst}>
          Previous
        </Button>
        <Button size="sm" colorScheme="blue" onClick={onNext}>
          {isLast ? "Finish" : "Next"}
        </Button>
      </Flex>
    </Box>
  );
}