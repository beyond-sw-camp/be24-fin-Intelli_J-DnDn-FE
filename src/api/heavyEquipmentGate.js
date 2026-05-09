import {
  fetchGateList,
  fetchGate,
  createGate,
  updateGatePosition,
  updateGateVehicles,
  updateGateManpower,
  addGateMachine,
  toggleGateMachine,
  removeGateMachine,
  deleteGate,
} from '@/api/gate'
import { getGateEquipments } from '@/api/workOrder'

export async function fetchHeavyEquipmentGateList() {
  const response = await fetchGateList()
  return Array.isArray(response) ? response : []
}

export async function fetchHeavyEquipmentGate(gateId) {
  return fetchGate(gateId)
}

export async function createHeavyEquipmentGate(payload) {
  return createGate(payload)
}

export async function updateHeavyEquipmentGatePosition(gateId, payload) {
  return updateGatePosition(gateId, payload)
}

export async function updateHeavyEquipmentGateVehicles(gateId, vehicles) {
  return updateGateVehicles(gateId, vehicles)
}

export async function updateHeavyEquipmentGateManpower(gateId, manpower) {
  return updateGateManpower(gateId, manpower)
}

export async function addHeavyEquipmentGateMachine(gateId) {
  return addGateMachine(gateId)
}

export async function toggleHeavyEquipmentGateMachine(gateId, machineId) {
  return toggleGateMachine(gateId, machineId)
}

export async function removeHeavyEquipmentGateMachine(gateId, machineId) {
  return removeGateMachine(gateId, machineId)
}

export async function deleteHeavyEquipmentGate(gateId) {
  return deleteGate(gateId)
}

export async function fetchGateWorkOrderEquipments(targetDate) {
  const response = await getGateEquipments(targetDate)
  return Array.isArray(response) ? response : []
}
