import { useState, useEffect } from "react";
import {
  ChakraProvider,
  Container,
  Heading,
  SimpleGrid,
  Box,
  Flex
} from "@chakra-ui/react";
import SheetComponent from "./SheetComponent";
import DashboardComponent from "./DashboardComponent";
// replaced NetworkDefinitionPage with DefinitionWizard
import DefinitionWizard from "./DefinitionWizard";
import NetworkDefinitionButton from "./NetworkDefinitionButton";
import { generateGetDataPayload } from "./payloadGenerator";
import { getPayloadFromUrl } from "./o9Interfacehelper";
import { getNetworkSummaryPayload } from "./payloads";
export const API_BASE_URL = "http://localhost:8998";
export const new_component = "Network Aggregation Demo";
export const tenantID = 6760; // Replace with your actual tenant ID
function NetworkAggHomePage() {
  const [firstSheetFilters, setFirstSheetFilters] = useState({});
  const [currentPage, setCurrentPage] = useState("home"); // "home" | "networkDefinition"
  const [networkDefPayload, setNetworkDefPayload] = useState(null);

  // Add state for fetched data
// Placeholder payload identifier
  const [networkSummaryData, setNetworkSummaryData] = useState(null);
  const [networkSummaryLoading, setNetworkSummaryLoading] = useState(true);
  const [networkSummaryError, setNetworkSummaryError] = useState(null);

  const handleDefineNetwork = (definition) => {
    console.log("Creating network with definition:", definition);
    setNetworkDefPayload(definition);
    setCurrentPage("networkDefinition");
  };

  // Effect: Fetch data on mount
  useEffect(() => {
    setNetworkSummaryLoading(true);
    getPayloadFromUrl({payload: generateGetDataPayload(getNetworkSummaryPayload()?.Query)})
      .then((data) => {
        // console.log("Network summary data:",data );
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data);

          } catch (parseError) {
            throw new Error("Failed to parse API response as JSON: " + parseError.message);
          }
        }
        else {
          setNetworkSummaryData(data)
        }
      })
      .catch((error) => {
        setNetworkSummaryError(error.message);
      })
      .finally(() => {
        setNetworkSummaryLoading(false);
      });
  }, []);  // Empty dependency array: run only once on mount

  if (currentPage === "networkDefinition" && networkDefPayload) {
    return (
      <ChakraProvider>
        <DefinitionWizard
          {...networkDefPayload}
          onBack={() => {
            setCurrentPage("home");
            setNetworkDefPayload(null);
          
          }}
          previewUrl={'https://mygcppmm.o9solutions.com/kibo2?tn=CPGDev19#/EKG/Daily%20Network/Daily%20Network'}
        />
      </ChakraProvider>
    );
  }

  return (
    <ChakraProvider>
      <Container maxW="100%" p={4}>
        <Heading mb={6} textAlign="center">
          Network Aggregation Dashboard
        </Heading>

        <SimpleGrid columns={1} spacing={6} mb={6}>
          <Box bg="white" p={4} borderRadius="lg" boxShadow="md">
            <DashboardComponent />
          </Box>
        </SimpleGrid>

        <SimpleGrid columns={1} spacing={6}>
          <Box bg="white" p={4} borderRadius="lg" >
            <Flex justify="flex-end" mb={2}>
              <NetworkDefinitionButton 
                firstSheetFilters={firstSheetFilters}
                onDefine={handleDefineNetwork}
              />
            </Flex>
            {/* Pass resolved data instead of the Promise */}
            {networkSummaryLoading ? (
              <div>Loading network summary...</div>
            ) : networkSummaryError ? (
              <div>Error: {networkSummaryError}</div>
            ) : (
              <SheetComponent data={networkSummaryData} onFiltersChange={setFirstSheetFilters} />
            )}
          </Box>
          <Box bg="white" p={4} borderRadius="lg" >
            <SheetComponent dataUrl={`${API_BASE_URL}/read/network_violations.csv`} />
          </Box>
        </SimpleGrid>

      </Container>
    </ChakraProvider>
  );
}

export default NetworkAggHomePage;
