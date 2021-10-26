import ChartColor from './chart_color'

const statusColor = (status) => {
  if (status == 'Pending') {
    return ChartColor.yellow().rgbString()
  } else if (status == 'Approved') {
    return ChartColor.green().rgbString()
  } else if (status == 'Denied') {
    return ChartColor.red().rgbString()
  }

  return ChartColor.grey().rgbString()
}

export default statusColor
