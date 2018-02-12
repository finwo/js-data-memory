module.exports = {
  table : [
    {
      code        : 't01',
      max_chairs  : 5
    },{
      code        : 't02',
      max_chairs  : 6
    },{
      code        : 't03',
      max_chairs  : 3
    }
  ],
  chair : [
    {
      code     : 'c01',
      table_id : 't01'
    },{
      code     : 'c02',
      table_id : 't01'
    },{
      code     : 'c03',
      table_id : 't01'
    },{
      code     : 'c04',
      table_id : 't02'
    },{
      code     : 'c05',
      table_id : 't02'
    }
  ],
  guest : [
    {
      name          : 'guest1',
      age           : 30,
      table_ids     : ['t01', 't02', 't03'],
      chair_id      : 'c01',
      lucky_numbers : [1]
    },{
      name          : 'guest2',
      age           : 30,
      table_ids     : ['t01'],
      chair_id      : 'c02',
      lucky_numbers : [2, 3, 4]
    },{
      name          : 'guest3',
      age           : 25,
      table_ids     : ['t01', 't02'],
      chair_id      : 'c03',
      lucky_numbers : [1, 4, 5]
    },{
      name          : 'guest4',
      age           : 35,
      table_ids     : ['t02', 't03'],
      chair_id      : 'c04',
      lucky_numbers : [1, 2]
    }
  ],
  log : [
    {
      time       : new Date().getTime(),
      owner_id   : 't01',
      owner_type : 'table'
    },{
      time       : new Date().getTime() - (50*60*1000),
      owner_id   : 't01',
      owner_type : 'table'
    },{
      time       : new Date().getTime() - (50*60*1000),
      owner_id   : 't03',
      owner_type : 'table'
    },{
      time       : new Date().getTime() - (50*60*1000),
      owner_id   : 'c01',
      owner_type : 'chair'
    },{
      time       : new Date().getTime() - (50*60*1000),
      owner_id   : 'c02',
      owner_type : 'chair'
    },{
      time       : new Date().getTime() - (50*60*1000),
      owner_id   : 'c03',
      owner_type : 'chair'
    },{
      time       : new Date().getTime() - (50*60*1000),
      owner_id   : 'guest2',
      owner_type : 'guest'
    },{
      time       : new Date().getTime() - (50*60*1000),
      owner_id   : 'guest2',
      owner_type : 'guest'
    },{
      time       : new Date().getTime() - (50*60*1000),
      owner_id   : 'guest4',
      owner_type : 'guest'
    }
  ],
  example : [
    {
      unique : 'unique_value',
      value  : 'test1'
    },{
      unique : 'unique_value',
      value  : 'test2'
    },{
      unique : 'unique_value',
      value  : 'test3'
    }
  ]
};