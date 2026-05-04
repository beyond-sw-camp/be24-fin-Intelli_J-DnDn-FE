import api from './index'

export const uploadMasterSchedule = ({ projectId, docType, file }) => {
  const formData = new FormData()

  formData.append('projectId', projectId)
  formData.append('docType', docType)
  formData.append('file', file)

  return api.post('/master-schedule/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 60000,
  })
}

export const getMasterScheduleList = ({ projectId, docType }) => {
  return api.get('/master-schedule', {
    params: {
      projectId,
      docType,
    },
  })
}

export const getMasterScheduleDetail = (scheduleId) => {
  return api.get(`/master-schedule/${scheduleId}`)
}

export const deleteMasterSchedule = (scheduleId) => {
  return api.delete(`/master-schedule/${scheduleId}`)
}
