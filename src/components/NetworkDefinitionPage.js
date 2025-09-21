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

import NetworkGraph from "./NetworkGraph";
import { getPayloadFromUrl } from "./o9Interfacehelper";
import React, { useState, useEffect } from "react";
import { materialDetailsDataPayload } from "./payloads"
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
      const res = await fetch("http://127.0.0.1:8998/docs", { method: "GET" });
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
      // const data = await getPayloadFromUrl("http://127.0.0.1:8998/read_json/material_definition_multilevels.json");
      const data = await getPayloadFromUrl({ payload : materialDetailsDataPayload});
      setMaterialDetailsData(data);
    } catch (err) {
      setMaterialDetailsError(err.message || String(err));
    } finally {
      setMaterialDetailsLoading(false);
    }
  };

  useEffect(() => {
    setNetworkMaterialRulesDataLoading(true);
    getPayloadFromUrl({url:"http://127.0.0.1:8998/read_json/material_definition_rules.json"})
      .then((data) => {
        setNetworkMaterialRulesData(data);
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
          <Box bg="white" p={4} borderRadius="lg" boxShadow="md" overflowX="auto">
            <SheetComponent dataUrl="http://127.0.0.1:8998/read/material_definition_rules.csv" data={networkMaterialRulesData} />
          </Box>
        </SimpleGrid>
      </Box>

      {/* Summary of Material Definition */}
      <Box w="100%" mb={6}>
        <Heading size="sm" mb={3}>
            Summary of Material Definition
        </Heading>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} w="100%">
            <Box bg="white" p={4} borderRadius="lg" boxShadow="md" overflowX="auto">
            <SheetComponent dataUrl="http://127.0.0.1:8998/read/summary_definition1.csv" />
            </Box>
            <Box bg="white" p={4} borderRadius="lg" boxShadow="md" overflowX="auto">
            <SheetComponent dataUrl="http://127.0.0.1:8998/read/summary_definition2.csv" />
            </Box>
        </SimpleGrid>
      </Box>

      {/* Material Definition - Details (toggle Table / Network) - Only visible after ABDM */}
      {abdmCompleted && (
        <Box w="100%" mb={6}>
          <Flex justify="space-between" align="center" mb={3}>
            <Heading size="sm">Material Definition - Details</Heading>
          </Flex>

         
            <SimpleGrid columns={1} spacing={6}>
              <Box bg="white" p={4} borderRadius="lg" boxShadow="md" overflowX="auto">
                <SheetComponent
                  data={materialDetailsData}
                  isLoading={materialDetailsLoading}
                  error={materialDetailsError}
                  config = {{ enabled: true, levelDimension: 'Level', targetDimension: 'Item' }}
                />
              </Box>
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