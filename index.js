const sqlite = require('sqlite3').verbose();
const db = new sqlite.Database('./KoboReader.sqlite')
const fs = require('fs');

const authorQuery = 'select Attribution from content where content.ContentID = Bookmark.VolumeID'
const bookTitleQuery = 'select Title from content where content.ContentID = Bookmark.VolumeID'
const bookChapterQuery = 'select Title from content where ChapterIDBookmarked = Bookmark.ContentID'
const query = `
select * from (
select BookTitle,
	Title,
	Text,
	Annotation,
	content.ContentID,
	(${authorQuery}) Author,
	(${bookTitleQuery}) BookTitle,
	(${bookChapterQuery}) Chapter
	from Bookmark
	join content on content.ContentID = Bookmark.ContentID
)
`

const results = {};

db.each(query, (err, row) => {
	if (err) {
		console.log(err)
	}

	processRow(row)
}, completeCallback);

function processRow(row) {
	const chapter = row.Chapter ? row.Chapter : '';
	const bookTitle = row.BookTitle
	if (!results[bookTitle]) {
		results[bookTitle] = []
	}

	if (!results[bookTitle][chapter]) {
		results[bookTitle][chapter] = []
	}

  results[bookTitle][chapter].push(row);
	return results
}

function completeCallback(err, count) {
	if (err) {
		console.log('Erro on complete', err)
		return;
	}

	console.log(`Completed. Retrieved ${count} rows`)
	createMarkdownFile()
}

function createMarkdownFile() {
  const keys = Object.keys(results)

	for (let i = 0; i < keys.length; i++) {
		// console.log(`Creating file for ${keys[i]}`)
		const chapters = Object.keys(results[keys[i]]);
		let contentStr = ``
		for (let j = 0; j < chapters.length; j++) {
			const highlights = results[keys[i]][chapters[j]]
  		const chapter = chapters[j]

			if (chapter !== '') {
				contentStr = contentStr + `* ${chapter}` + '\n'
			}

			for (let k = 0; k < highlights.length; k++) {
				const chapter = chapters[j]
				const highlight = highlights[k].Text
				if (highlight) {
					if (chapter !== '') {
						contentStr = contentStr + `   * ${highlight}` + '\n'
					} else {
						contentStr = contentStr + `* ${highlight}` + '\n'
					}
				}
			}
		}

		try {
			 fs.writeFileSync(`${keys[i]}.md`, contentStr)
		} catch (err) {
			console.log('Error writting file', err)
		}
	}

  /* for (let i = 0; i < keys.length; i++) {
	  const values = results[keys[i]]
		let contentStr = ``
		for (let j = 0; j < values.length; j++) {
			const val = values[j].Text
			if (val) {
				const annotations = values[j].Annotation
				const chapter = values[j].Chapter
				contentStr = contentStr + '* ' + val + '\n'
				if (chapter) {
					contentStr = contentStr + '  *Chapter* ' + chapter + '\n'
				}
				if (annotations) {
					contentStr = contentStr + '  * > ' + annotations + '\n'
				}
			}
		}

		try {
			 fs.writeFileSync(`${keys[i]}.md`, contentStr)
		} catch (err) {
			console.log('Error writting file', err)
		}
	} */
}

db.close(function(err) {
	if(err) {
		console.log('Error closing database', err)
		return
	}

	console.log('Closed database connection')
})
