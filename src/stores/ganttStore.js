// src/stores/ganttStore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useGanttStore = defineStore('gantt', () => {
  const tasks = ref([])
  const milestones = ref([])
  const projectInfo = ref({})

  function setData(newTasks, newMilestones, newProjectInfo) {
    tasks.value = newTasks
    milestones.value = newMilestones
    projectInfo.value = newProjectInfo
  }

  return { tasks, milestones, projectInfo, setData }
})