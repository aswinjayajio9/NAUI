import React from "react";
import { Table, Thead, Tbody, Tr, Th, Td, Box } from "@chakra-ui/react";

function TableComponent({ data, columns }) {
  return (
    <Box overflowX="auto">
      <Table variant="striped" size="sm" minW="400px">
        <Thead>
          <Tr>
            {columns.map((col) => (
              <Th key={col.accessor}>{col.header}</Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {data.map((row, idx) => (
            <Tr key={idx}>
              {columns.map((col) => (
                <Td key={col.accessor}>{row[col.accessor]}</Td>
              ))}
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}

export default TableComponent;
